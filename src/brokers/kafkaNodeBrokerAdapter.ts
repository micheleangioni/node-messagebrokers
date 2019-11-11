import {Spec02Payload, Spec03Payload} from 'cloudevents-sdk';
import kafka, {ConsumerGroupOptions, KafkaClient, Producer, ProduceRequest} from 'kafka-node';
import IEventInterface from '../events/IEventInterface';
import ILoggerInterface from '../logger/ILoggerInterface';
import AbstractBroker from './abstractMessageBroker';
import {
  KafkaNodeConsumerPayloads,
  KafkaNodeOptions,
  KafkaNodeSslOptions,
  KafkaNodeTopics,
  MessageErrorData,
  MessageOptions,
} from './declarations';
import IMessageBroker from './IBrokerInterface';
import { MessageError } from './MessageError';

export default class KafkaNodeBrokerAdapter extends AbstractBroker implements IMessageBroker {
  public initialised = false;
  private readonly brokers: string[];
  private client?: KafkaClient;
  private readonly partitionerType?: number;
  private producer?: Producer;
  private readonly sslOptions?: KafkaNodeSslOptions;
  private readonly topics: KafkaNodeTopics = {};

  constructor(
    brokers: string[],
    { partitionerType, sslOptions, topics }: KafkaNodeOptions,
    private logger?: ILoggerInterface,
  ) {
    super();

    if (partitionerType && (!Number.isInteger(partitionerType) || partitionerType < 0 || partitionerType > 4)) {
      partitionerType = 0;
    }

    this.sslOptions = sslOptions;
    if (topics) { this.topics = topics; }
    this.brokers = brokers;

    this.partitionerType = partitionerType;
    this.sslOptions = sslOptions;
    this.brokers = brokers;

    this.initialised = false;

    if (topics) {
      this.topics = topics;
    }
  }

  public async init(): Promise<true> {
    this.client = await this.createClient();
    this.producer = await this.createProducer({ partitionerType: this.partitionerType });
    await this.createTopics();

    return true;
  }

  public async addConsumer(
    aggregate: string|string[],
    handler?: (message: unknown) => void,
  ): Promise<kafka.ConsumerGroup> {
    const aggregates = typeof aggregate === 'string'
      ? [aggregate]
      : aggregate;

    const topics = aggregates.reduce((acc: string[], aggregateName) => {
      if (this.topics[aggregateName]) {
        acc.push(this.topics[aggregateName].topic);
      }

      return acc;
    }, []);

    const consumerPayloads = topics.map((topic) => ({
      topic,
    }));

    return await this.addKafkaConsumer(consumerPayloads,  handler);
  }

  public async addKafkaConsumer(
    consumerPayloads: KafkaNodeConsumerPayloads,
    handler?: (message: unknown) => void,
  ): Promise<kafka.ConsumerGroup> {
    const topics = consumerPayloads.map((consumerPayload) => consumerPayload.topic);

    const consumerGroupOptions: ConsumerGroupOptions = {
      fromOffset: 'latest',
      groupId: 'ConsumerGroupId',
      kafkaHost: this.brokers.join(','),
    };

    if (this.sslOptions) {
      consumerGroupOptions.ssl = true;
      consumerGroupOptions.sslOptions = this.getSslOptions();
    }

    const consumer = new kafka.ConsumerGroup(consumerGroupOptions, topics);

    if (handler) {
      consumer.on('error', (err) => {
        if (this.logger) {
          this.logger.error({
            err,
            message: 'Kafka ConsumerGroup error',
            type: 'kafka',
          });
        }
      });

      consumer.on('offsetOutOfRange', (err) => {
        if (this.logger) {
          this.logger.error({
            err,
            message: 'Kafka ConsumerGroup offsetOutOfRange error',
            type: 'kafka',
          });
        }
      });

      consumer.on('message', handler);
    }

    return consumer;
  }

  public async sendMessage(
    aggregate: string,
    events: IEventInterface<Spec02Payload | Spec03Payload>[],
    { partitionKey }: MessageOptions,
  ): Promise<any> {
    if (!this.producer) {
      this.producer = await this.createProducer({ partitionerType: this.partitionerType });
    }

    const eventPayloadList = events.reduce((acc: ProduceRequest[], event) => {
      acc.push(this._createEventPayload(aggregate, event, partitionKey));

      return acc;
    }, []);

    this.producer.send(eventPayloadList, (err, data) => {
      if (this.logger) {
        if (err) {
          const errorData: MessageErrorData = {
            data,
            err,
            message: `Error publishing ${aggregate} event list`,
            type: 'kafka',
          };

          this.logger.error(errorData);

          throw new MessageError(errorData);
        }

        this.logger.debug({
          data,
          err,
          message: `Successfully published ${aggregate} event list`,
          type: 'kafka',
        });
      }

      return data;
    });
  }

  public async createClient(): Promise<KafkaClient> {
    return new Promise((resolve, reject) => {
      const clientOptions: any = { kafkaHost: this.brokers.join(',') };

      if (this.sslOptions) {
        clientOptions.sslOptions = this.getSslOptions();
      }

      const client = new kafka.KafkaClient(clientOptions);

      client.on('connect', () => {
        if (this.logger) {
          this.logger.debug({
            message: 'Kafka client successfully connected to the Broker',
            type: 'kafka',
          });
        }

        resolve(client);
      });
    });
  }

  public async createProducer({ partitionerType }: any): Promise<kafka.Producer> {
    if (!this.client) {
      this.client = await this.createClient();
    }

    return new Promise((resolve) => {
      const producer = new kafka.Producer((this.client as KafkaClient), { partitionerType });

      producer.on('ready', () => {
        if (this.logger) {
          this.logger.debug({
            message: 'Kafka producer ready to publish',
            type: 'kafka',
          });
        }

        resolve(producer);
      });
    });
  }

  private async createTopics(): Promise<boolean> {
    if (!this.client) {
      this.client = await this.createClient();
    }

    return new Promise((resolve, reject) => {
      (this.client as KafkaClient).createTopics(Object.values(this.topics), (error: any, result: any) => {
        if (error) {
          return reject(result ? result : error);
        } else if (result.length > 0) {
          const errorMessage = result.reduce((message: any, err: any) => {
            message += `${err.topic}: ${err.error} `;

            return message;
          }, '');

          if (this.logger) {
            this.logger.warning({
              error,
              message: errorMessage,
              type: 'kafka',
            });
          }
        }

        this.initialised = true;

        resolve(true);
      });
    });
  }

  /**
   * Create an event payload from a `IEventInterface` complaint event instance.
   *
   * @param {string} aggregate
   * @param {IEventInterface} event
   * @param {string|undefined} key
   * @return {object}
   */
  private _createEventPayload(
    aggregate: string,
    event: IEventInterface<Spec02Payload | Spec03Payload>,
    key?: string,
  ): ProduceRequest {
    const topic = this.topics[aggregate] ?
      this.topics[aggregate].topic :
      undefined;

    if (!topic) {
      throw new Error(`No topic for aggregate: ${aggregate}`);
    }

    const message = key ?
      new kafka.KeyedMessage(key, JSON.stringify(event.format())) :
      JSON.stringify(event.format());

    return key ?
      {
        key,
        messages: [message],
        topic,
      } :
      {
        messages: [message],
        topic,
      };
  }

  private getSslOptions() {
    return this.sslOptions
      ? {
        // Necessary only if the server requires client certificate authentication.
        cert: this.sslOptions.cert,
        key: this.sslOptions.key,

        // Necessary only if the server uses a self-signed certificate.
        ca: this.sslOptions.ca,

        // Necessary only if the server's cert isn't for "localhost".
        checkServerIdentity: () => null,
      }
      : {};
  }
}
