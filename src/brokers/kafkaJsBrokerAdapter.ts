import {
  Consumer,
  ConsumerConfig,
  ConsumerRunConfig,
  ITopicMetadata,
  Kafka,
  KafkaConfig,
  KafkaMessage,
  logLevel,
  Message,
  Partitioners,
  Producer,
  ProducerConfig,
  ProducerRecord,
  RecordMetadata,
} from 'kafkajs';
import BrokerInterface from './abstractMessageBroker';
import {
  KafkaJsClientConfiguration,
  KafkaJsConsumerConfig,
  KafkaJsOptions,
  KafkaJsTopics,
  Partitioner,
  SendMessageOptions,
  TopicsHandlers,
} from './declarations';
import IBrokerInterface from './IBrokerInterface';
import IEventInterface from '../events/IEventInterface';

export default class KafkaJsBrokerAdapter extends BrokerInterface implements IBrokerInterface {
  public initialised: boolean = false;
  private client?: Consumer;
  private readonly kafka: Kafka;
  private readonly partitionerFunction?: Partitioner;
  private producer?: Producer;
  private topics: KafkaJsTopics;

  private static isKafkaLogLevelValid(inputLogLevel?: logLevel | string): inputLogLevel is logLevel {
    return Object.values(logLevel).includes(inputLogLevel as logLevel);
  }

  constructor(brokers: string[], { clientId, partitionerFunction, sslOptions, topics }: KafkaJsOptions) {
    super();

    const kafkaConfig: KafkaConfig = {
      brokers,
      logLevel: KafkaJsBrokerAdapter.isKafkaLogLevelValid(process.env.KAFKA_LOG_LEVEL)
        ? process.env.KAFKA_LOG_LEVEL
        : logLevel.INFO,
      ...(clientId && { clientId }),
    };

    if (sslOptions) {
      kafkaConfig.ssl = sslOptions;
    }

    this.kafka = new Kafka(kafkaConfig);

    this.partitionerFunction = partitionerFunction;
    this.topics = topics;
  }

  public async init(consumerOptions?: KafkaJsClientConfiguration): Promise<true> {
    this.client = await this.createConsumerClient(consumerOptions);
    this.producer = await this.createProducer({ partitionerFunction: this.partitionerFunction });

    if (consumerOptions?.createTopics) {
      await this.createTopics();
    }

    await super.init();

    return true;
  }

  /**
   * Create and attach a new consumer.
   *
   * @param {any} _
   * @param {KafkaJsConsumerConfig} consumerConfig
   * @return Promise<Consumer>
   */
  public async addConsumer(
    _: any,
    consumerConfig: KafkaJsConsumerConfig,
  ): Promise<Consumer> {
    if (!this.initialised || !this.client) {
      throw new Error('Client is not initialized');
    }

    const topicsHandlers: TopicsHandlers = {};

    const subscribePromises = Object.keys(consumerConfig.aggregates).map((aggregate) => {
      if (!consumerConfig.aggregates[aggregate]) {
        throw new Error(`Invalid Consumer options for aggregate ${aggregate}`);
      }

      const aggregateConfig = consumerConfig.aggregates[aggregate];

      // Fill in also topicsHandlers
      topicsHandlers[aggregateConfig.topic] = { handler: aggregateConfig.handler };

      return this.client?.subscribe({
        fromBeginning: aggregateConfig.fromBeginning || false,
        topic: aggregateConfig.topic,
      });
    });

    await Promise.all(subscribePromises);

    // Create base config
    const completeRunConfig: ConsumerRunConfig = {
      ...consumerConfig.consumerRunConfig,
    };

    // Check whether eachMessage or eachBatch should be used

    if (consumerConfig.useBatches === true) {
      completeRunConfig.eachBatch = async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
        const topic = batch.topic;

        for (const message of batch.messages) {
          if (!isRunning() || isStale()) {
            break;
          }

          await this.processMessage(topicsHandlers, topic, message);

          // Mark a message in the batch as processed
          resolveOffset(message.offset);

          // Heartbeat the Broker
          await heartbeat();
        }
      };
    } else {
      completeRunConfig.eachMessage = async ({ topic, message }) => {
        await this.processMessage(topicsHandlers, topic, message);
      };
    }

    await this.client.run(completeRunConfig);

    return this.client;
  }

  /**
   * Send new Cloudevent-formatted events for input Aggregate.
   *
   * @param {string} aggregate
   * @param {IEventInterface[]} events
   * @param {string|undefined} partitionKey
   * @return Promise<RecordMetadata[]>
   */
  public async sendMessage(
    aggregate: string,
    events: IEventInterface[],
    { partitionKey }: SendMessageOptions = {},
  ): Promise<RecordMetadata[]> {
    if (!this.initialised) {
      throw new Error('Client is not initialized');
    }

    return (this.producer as Producer).send(this._createEventPayload(aggregate, events, partitionKey));
  }

  /**
   * Create an event payload from some `cloudevents` complaint event instance.
   * The same key will be used for all of them.
   *
   * @see https://github.com/cloudevents/spec/blob/v0.2/spec.md
   * @param {string} aggregate
   * @param {IEventInterface[]} cloudevents
   * @param {string|undefined} key
   * @return {object}
   */
  public _createEventPayload(aggregate: string, cloudevents: IEventInterface[], key?: string): ProducerRecord {
    const topic = this.topics[aggregate] ?
      this.topics[aggregate].topic :
      undefined;

    if (!topic) {
      throw new Error(`No topic for aggregate: ${aggregate}`);
    }

    return {
      messages: cloudevents.map((cloudevent: any) => this.createEventMessage(cloudevent, key)),
      topic,
    };
  }

  private createEventMessage(cloudevent: IEventInterface, key?: string): Message {
    return {
      key,
      value: JSON.stringify(cloudevent.toJSON()),
    };
  }

  private async createConsumerClient(consumerOptions?: ConsumerConfig): Promise<Consumer> {
    const options: ConsumerConfig = {
      ...consumerOptions,
      ...{ groupId: consumerOptions?.groupId ?? 'default-group' },
    };

    const consumer = this.kafka.consumer(options);
    await consumer.connect();

    return consumer;
  }

  private async createProducer({ partitionerFunction }: any): Promise<Producer> {
    const producerOptions: ProducerConfig = {};

    producerOptions.createPartitioner = partitionerFunction
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      ? () => partitionerFunction
      : Partitioners.JavaCompatiblePartitioner;

    const producer = this.kafka.producer(producerOptions);
    await producer.connect();

    return producer;
  }

  private async createTopics(): Promise<boolean> {
    const adminClient = this.kafka.admin();
    await adminClient.connect();

    // Fetch existing topics and get the ones which need to be created

    const allTopics = Object.values(this.topics);

    // @ts-ignore
    const existingTopicsMetadataList = (await adminClient.fetchTopicMetadata()).topics
      .map((topicMetadata: ITopicMetadata) => topicMetadata.name);

    const topicsToBeCreated = allTopics
      .filter((kafkaJsTopic) => !existingTopicsMetadataList.includes(kafkaJsTopic.topic));

    await adminClient.createTopics({
      topics: topicsToBeCreated,
    });

    await adminClient.disconnect();

    return true;
  }

  private async processMessage(topicsHandlers: TopicsHandlers, topic: string, message: KafkaMessage ) {
    if (!topicsHandlers[topic] || !topicsHandlers[topic].handler) {
      return;
    }

    await topicsHandlers[topic].handler(message);
  }
}
