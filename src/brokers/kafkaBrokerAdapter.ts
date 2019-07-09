import { Spec01Payload, Spec02Payload } from 'cloudevents-sdk';
import kafka, { KafkaClientOptions, ProduceRequest } from 'kafka-node';
import IEventInterface from '../events/IEventInterface';
import AbstractBroker from './abstractMessageBroker';
import {
  KafkaBrokerOptions,
  KafkaProducerOptions,
  KafkaTopics,
  MessageErrorData,
  MessageOptions,
  SslOptions,
} from './declarations';
import IMessageBroker from './IMessageBroker';
import { MessageError } from './MessageError';

export default class KafkaBrokerAdapter extends AbstractBroker implements IMessageBroker {
  public initialised = false;
  private readonly client: kafka.KafkaClient;
  private readonly producer: kafka.Producer;
  private readonly sslOptions?: SslOptions;
  private readonly topics: KafkaTopics = {};
  private readonly uri: string;

  constructor({ partitionerType, sslOptions, topics, uri }: KafkaBrokerOptions) {
    super();

    if (partitionerType && (!Number.isInteger(partitionerType) || partitionerType < 0 || partitionerType > 4)) {
      partitionerType = 0;
    }

    this.sslOptions = sslOptions;
    if (topics) { this.topics = topics; }
    this.uri = uri;

    this.client = this._createClient(uri, sslOptions);
    this.producer = this._createProducer({ partitionerType });
  }

  public init(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.createTopics(Object.values(this.topics), (error, result) => {
        if (error) {
          return reject(result ? result : error);
        }

        if (result.length > 0) {
          const errorText = result.reduce((message, errorMessage) => {
            message += `${errorMessage.topic}: ${errorMessage.error} `;

            return message;
          }, '');

          if (this.logger) {
            this.logger.warning({
              error,
              message: errorText,
              type: 'kafka',
            });
          }
        }

        this.initialised = true;

        resolve(true);
      });
    });
  }

  public async sendMessage(
    aggregate: string,
    event: IEventInterface<Spec01Payload | Spec02Payload>,
    { partitionKey }: MessageOptions,
  ): Promise<any> {
    const eventPayload = this._createEventPayload(aggregate, event, partitionKey);

    this.producer.send([eventPayload], (err, data) => {
      if (this.logger) {
        if (err) {
          const errorData: MessageErrorData = {
            data,
            err,
            message: `Error publishing ${aggregate} ${event.getType()} event`,
            type: 'kafka',
          };

          this.logger.error(errorData);

          throw new MessageError(errorData);
        }

        this.logger.debug({
          data,
          err,
          message: `Successfully published ${aggregate} ${event.getType()} event`,
          type: 'kafka',
        });
      }

      return data;
    });
  }

  public async sendMessageList(
    aggregate: string,
    events: IEventInterface<Spec01Payload | Spec02Payload>[],
    { partitionKey }: MessageOptions,
  ): Promise<any> {
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
    event: IEventInterface<Spec01Payload | Spec02Payload>,
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

  private _convertTimestringToUnixTimestampString(timestring: string) {
    return Math.round(((new Date(timestring).getTime()) / 1000)).toString();
  }

  private _createClient(uri: string, sslOptions?: SslOptions): kafka.KafkaClient {
    const clientOptions: KafkaClientOptions = { kafkaHost: uri };

    if (sslOptions) {
      clientOptions.sslOptions = {
        // Necessary only if the server requires client certificate authentication.
        cert: sslOptions.cert,
        key: sslOptions.key,

        // Necessary only if the server uses a self-signed certificate.
        ca: sslOptions.ca,

        // Necessary only if the server's cert isn't for "localhost".
        checkServerIdentity: sslOptions.checkServerIdentity ?
          sslOptions.checkServerIdentity :
          () => null,
      };
    }

    return new kafka.KafkaClient(clientOptions);
  }

  private _createProducer({ partitionerType }: KafkaProducerOptions): kafka.Producer {
    return new kafka.Producer(this.client, { partitionerType });
  }
}
