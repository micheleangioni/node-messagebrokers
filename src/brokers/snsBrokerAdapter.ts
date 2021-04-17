import AWS, {AWSError, SNS} from 'aws-sdk';
import {CreateTopicResponse, ListTopicsResponse, PublishResponse, SubscribeResponse} from 'aws-sdk/clients/sns';
import IEventInterface from '../events/IEventInterface';
import BrokerInterface from './abstractMessageBroker';
import {
  AggregatesTopicArns,
  KafkaTopics,
  SnsClientConfiguration,
  SnsConsumerOptions,
  SnsOptions,
} from './declarations';
import IBrokerInterface from './IBrokerInterface';

export default class SnsBrokerAdapter extends BrokerInterface implements IBrokerInterface {
  public initialised: boolean = false;
  private awsAccountId?: string;
  private endpoint?: string;
  private region?: string;
  private sns?: SNS;
  private topics: KafkaTopics;
  private topicDescriptions: AggregatesTopicArns = {};

  constructor({ awsAccountId, endpoint, region, topics }: SnsOptions) {
    super();

    this.awsAccountId = awsAccountId;
    this.endpoint = endpoint;
    this.region = region;
    this.topics = topics;
  }

  public async init(initConfigurations?: SnsClientConfiguration): Promise<true> {
    this.sns = new AWS.SNS({
      apiVersion: '2010-03-31',
      ...(this.endpoint && { endpoint: this.endpoint }),
      ...(this.region && { region: this.region }),
      ...initConfigurations,
    });

    if (initConfigurations?.createTopics) {
      await this.createTopics();
    } else {
      await this.setTopicArns();
    }

    await super.init();

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
   * @param {IEventInterface[]} events
   * @return Promise<RecordMetadata[]>
   */
  public async sendMessage(
    aggregate: string,
    events: IEventInterface[],
  ): Promise<PublishResponse[]> {
    if (!this.initialised || !this.sns) {
      throw new Error('Client is not initialized');
    }

    if (!this.topicDescriptions[aggregate]) {
      throw new Error(`A topic for ${aggregate} does NOT exist`);
    }

    const publishPromises: Promise<PublishResponse>[] = events.map((event) => {
      const params: SNS.Types.PublishInput = {
        Message: JSON.stringify(event.toJSON()),
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

  private setTopicArns() {
    const awsAccountId = this.awsAccountId;
    const region = this.region;

    // If awsAccountId and region are provided, we can rebuild the ARNs without having to query AWS
    if (awsAccountId && region) {
      Object.keys(this.topics).forEach((aggregate) => {
        const topicName = this.topics[aggregate].topic;

        this.topicDescriptions[aggregate] = `arn:aws:sns:${region}:${awsAccountId}:${topicName}`;
      });
    } else {
      return new Promise<undefined>(((resolve, reject) => {
        // Fetch all the topics from AWS
        (this.sns as SNS).listTopics((err: AWSError, {Topics}: ListTopicsResponse) => {
          if (err) { return reject(err); }

          // Create an inverse map topicName => aggregate
          const nameAggregateMap = Object.keys(this.topics).reduce((map: Record<string, string>, aggregate) => {
            const topicName = this.topics[aggregate].topic;
            map[topicName] = aggregate;

            return map;
          }, {});

          const aggregateTopicNames = Object.values(this.topics).map(({topic}) => topic);

          // Loop over the fetched list of Topics
          Topics?.forEach(({TopicArn}) => {
            if (!TopicArn) return;

            const arnPieces = TopicArn?.split(':');
            const topicName = arnPieces[arnPieces.length - 1];

            if (aggregateTopicNames.includes(topicName)) {
              this.topicDescriptions[nameAggregateMap[topicName]] = TopicArn;
            }

            resolve(undefined);
          });
        });
      }));
    }
  }
}
