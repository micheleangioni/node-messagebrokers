import AWS, {AWSError, SNS} from 'aws-sdk';
import {ClientConfiguration, CreateTopicResponse, PublishResponse, SubscribeResponse} from 'aws-sdk/clients/sns';
import Cloudevent from 'cloudevents-sdk/v1';
import IEventInterface from '../events/IEventInterface';
import BrokerInterface from './abstractMessageBroker';
import {
  AggregatesTopicArns,
  KafkaTopics,
  SnsConsumerOptions,
  SnsOptions,
} from './declarations';
import IBrokerInterface from './IBrokerInterface';

export default class SnsBrokerAdapter extends BrokerInterface implements IBrokerInterface {
  public initialised: boolean = false;
  private endpoint?: string;
  private region?: string;
  private sns?: SNS;
  private topics: KafkaTopics;
  private topicDescriptions: AggregatesTopicArns = {};

  constructor({ endpoint, region, topics }: SnsOptions) {
    super();

    this.endpoint = endpoint;
    this.region = region;
    this.topics = topics;
  }

  public async init(initConfigurations?: ClientConfiguration): Promise<true> {
    this.sns = new AWS.SNS({
      apiVersion: '2010-03-31',
      ...(this.endpoint && { endpoint: this.endpoint }),
      ...(this.region && { region: this.region }),
      ...initConfigurations,
    });

    await this.createTopics();

    super.init();

    return true;
  }

  /**
   * Create and attach a new listener to input aggregate.
   *
   * @param {string} aggregate
   * @param {SnsConsumerOptions} consumerConfig
   * @return Promise<Consumer>
   */
  public async addConsumer(aggregate: string, consumerConfig: SnsConsumerOptions): Promise<SubscribeResponse> {
    if (!this.initialised || !this.sns) {
      throw new Error('Client is not initialized');
    }

    if (!this.topicDescriptions[aggregate]) {
      throw new Error(`A topic for ${aggregate} does NOT exist`);
    }

    const params: SNS.Types.SubscribeInput = {
      Endpoint: consumerConfig.endpoint,
      Protocol: consumerConfig.protocol,
      TopicArn: this.topicDescriptions[aggregate],
      ...(consumerConfig.attributes && { Attributes: consumerConfig.attributes }),
    };

    return new Promise(((resolve, reject) => {
      (this.sns as SNS).subscribe(params, (err: AWSError, data: SubscribeResponse) => {
        if (err) { return reject(err); }

        resolve(data);
      });
    }));
  }

  /**
   * Send new Cloudevent-formatted events for input Aggregate.
   *
   * @param {string} aggregate
   * @param {IEventInterface<Cloudevent>[]} events
   * @return Promise<RecordMetadata[]>
   */
  public async sendMessage(
    aggregate: string,
    events: IEventInterface<Cloudevent>[],
  ): Promise<PublishResponse[]> {
    if (!this.initialised || !this.sns) {
      throw new Error('Client is not initialized');
    }

    if (!this.topicDescriptions[aggregate]) {
      throw new Error(`A topic for ${aggregate} does NOT exist`);
    }

    const publishPromises: Promise<PublishResponse>[] = events.map((event) => {
      const params: SNS.Types.PublishInput = {
        Message: JSON.stringify(event.format()),
        // MessageAttributes: {},
        TopicArn: this.topicDescriptions[aggregate],
      };

      return new Promise((resolve, reject) => {
        (this.sns as SNS).publish(params, (err, data) => {
          if (err) { return reject(err); }

          resolve(data);
        });
      });
    });

    return await Promise.all(publishPromises);
  }

  private async createTopics(): Promise<boolean> {
    const topicParamsList: SNS.Types.CreateTopicInput[] = Object.keys(this.topics)
      .reduce((acc: SNS.Types.CreateTopicInput[], aggregate) => {
        acc.push({
          Attributes: {},
          Name: this.topics[aggregate].topic,
          Tags: [{
            Key: 'aggregate',
            Value: aggregate,
          }],
        });

        return acc;
      }, []);

    const createTopicPromises = topicParamsList.map(this.createTopic.bind(this));

    await Promise.all(createTopicPromises);

    return true;
  }

  private createTopic(params: SNS.Types.CreateTopicInput): Promise<CreateTopicResponse> {
    return new Promise<CreateTopicResponse>(((resolve, reject) => {
      (this.sns as SNS).createTopic(params, (err: AWSError, data: CreateTopicResponse) => {
        if (err) { return reject(err); }

        const aggregate = params.Tags?.find((tag) => tag.Key === 'aggregate')?.Value as string;
        this.topicDescriptions[aggregate] = data.TopicArn as string;

        resolve(data);
      });
    }));
  }
}
