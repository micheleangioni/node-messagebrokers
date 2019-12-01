import Cloudevent from 'cloudevents-sdk/v1';
import {
  Consumer,
  ConsumerConfig,
  ITopicMetadata,
  Kafka,
  KafkaConfig,
  logLevel,
  Message,
  Partitioners,
  Producer,
  ProducerConfig,
  ProducerRecord,
  RecordMetadata,
} from 'kafkajs';
import IEventInterface from '../events/IEventInterface';
import BrokerInterface from './abstractMessageBroker';
import {
  KafkaJsConsumerConfig,
  KafkaJsOptions,
  KafkaTopics,
  Partitioner,
  SendMessageOptions,
} from './declarations';
import IBrokerInterface from './IBrokerInterface';

export default class KafkaJsBrokerAdapter extends BrokerInterface implements IBrokerInterface {
  public initialised: boolean = false;
  private client?: Consumer;
  private readonly kafka: Kafka;
  private readonly partitionerFunction?: Partitioner;
  private producer?: Producer;
  private topics: KafkaTopics;

  constructor(brokers: string[], { clientId, partitionerFunction, sslOptions, topics }: KafkaJsOptions) {
    super();

    const kafkaConfig: KafkaConfig = {
      brokers,
      clientId,
      logLevel: logLevel.INFO,
    };

    if (sslOptions) {
      kafkaConfig.ssl = sslOptions;
    }

    this.kafka = new Kafka(kafkaConfig);

    this.partitionerFunction = partitionerFunction;
    this.topics = topics;
  }

  public async init(consumerOptions?: ConsumerConfig): Promise<true> {
    this.client = await this.createConsumerClient(consumerOptions);
    this.producer = await this.createProducer({ partitionerFunction: this.partitionerFunction });
    await this.createTopics();

    super.init();

    return true;
  }

  /**
   * Create and attach a new listener to input topic.
   *
   * @param {string} topic
   * @param {KafkaJsConsumerConfig} consumerConfig
   * @return Promise<Consumer>
   */
  public async addConsumer(topic: string, consumerConfig: KafkaJsConsumerConfig = {}): Promise<Consumer> {
    if (!this.initialised || !this.client) {
      throw new Error('Client is not initialized');
    }

    await this.client.subscribe({ fromBeginning: consumerConfig.fromBeginning || false, topic });
    await this.client.run(consumerConfig);

    return this.client;
  }

  /**
   * Send new Cloudevent-formatted events for input Aggregate.
   *
   * @param {string} aggregate
   * @param {IEventInterface<Cloudevent>[]} events
   * @param {string|undefined} partitionKey
   * @return Promise<RecordMetadata[]>
   */
  public async sendMessage(
    aggregate: string,
    events: IEventInterface<Cloudevent>[],
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
   * @param {IEventInterface<Cloudevent>[]} cloudevents
   * @param {string|undefined} key
   * @return {object}
   */
  public _createEventPayload(
    aggregate: string,
    cloudevents: IEventInterface<Cloudevent>[],
    key?: string,
  ): ProducerRecord {
    const topic = this.topics[aggregate] ?
      this.topics[aggregate].topic :
      undefined;

    if (!topic) {
      throw new Error(`No topic for aggregate: ${aggregate}`);
    }

    return {
      messages: cloudevents.map((cloudevent) => this.createEventMessage(cloudevent, key)),
      topic,
    };
  }

  private createEventMessage(cloudevent: IEventInterface<Cloudevent>, key?: string): Message {
    return {
      key,
      value: JSON.stringify(cloudevent.format()),
    };
  }

  private async createConsumerClient(consumerOptions?: ConsumerConfig): Promise<Consumer> {
    const options: ConsumerConfig = { groupId: 'my-group', ...consumerOptions };

    const consumer = this.kafka.consumer(options);
    consumer.connect();

    return consumer;
  }

  private createProducer({ partitionerFunction }: any): Producer {
    const producerOptions: ProducerConfig = {};

    producerOptions.createPartitioner = partitionerFunction
      ? () => partitionerFunction
      : Partitioners.JavaCompatiblePartitioner;

    return this.kafka.producer(producerOptions);
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
}
