/* eslint-disable no-shadow */
import {ClientConfiguration as AwsSnsClientConfiguration, SubscriptionAttributesMap} from 'aws-sdk/clients/sns';
import {ConsumerConfig, KafkaMessage} from 'kafkajs';

export type BrokerOptions = {
  awsAccountId?: string;
};

export type ClientConfiguration = Record<string, any> & {
  createTopics?: boolean;
};

export type SslOptions = {
  ca?: string[];
  cert: string;
  key: string;
};

export type TopicsHandlers = {
  [topic: string]: {
    handler: (message: KafkaMessage) => Promise<void>;
  };
};

export type KafkaTopic = {
  configEntries?: {
    name: string;
    value: string;
  }[];
  numPartitions?: number;
  replicaAssignment?: object[];
  replicationFactor?: number;
  topic: string;
};

export type KafkaTopics = {
  [aggregate: string]: KafkaTopic;
};

export type KafkaJsTopic = KafkaTopic;

export type KafkaJsTopics = {
  [aggregate: string]: KafkaJsTopic;
};

export type PartitionerParams = {
  message: any;
  partitionMetadata: {
    leader: string;
    partitionId: string;
  }[];
  topic: string;
};

export type Partitioner = (params: PartitionerParams) => number;

export type KafkaJsOptions = {
  clientId?: string;
  partitionerFunction?: Partitioner;
  sslOptions?: SslOptions;
  topics: KafkaTopics;
};

export type KafkaJsClientConfiguration = ConsumerConfig & {
  createTopics?: boolean;
};

export type AggregateConsumerConf = {
  fromBeginning?: boolean;
  handler: (message: KafkaMessage) => Promise<void>;
  topic: string;
};

export type KafkaJsConsumerConfig = {
  aggregates: {
    [aggregate: string]: AggregateConsumerConf;
  };
  consumerRunConfig?: {
    autoCommit?: boolean;
    autoCommitInterval?: number | null;
    autoCommitThreshold?: number | null;
    eachBatchAutoResolve?: boolean;
    partitionsConsumedConcurrently?: number;
  };
  useBatches?: boolean;
};

export type SendMessageOptions = {
  partitionKey?: string;
};

export type MessageErrorData = {
  data?: Record<string, unknown>;
  err: any;
  message: string;
  type?: string;
};

export type AggregatesTopicArns = {
  [aggregate: string]: string;
};

export type SnsOptions = {
  awsAccountId?: string;
  endpoint?: string;
  region?: string;
  topics: KafkaTopics;
};

export type SnsClientConfiguration = AwsSnsClientConfiguration & {
  createTopics?: boolean;
};

export enum SnsProtocol {
  APPLICATION = 'application',
  EMAIL = 'email',
  EMAIL_JSON = 'email-json',
  HTTP = 'http',
  HTTPS = 'https',
  LAMBDA = 'lambda',
  SMS = 'sms',
  SQS = 'sqs',
}

export type SnsConsumerOptions = {
  attributes?: SubscriptionAttributesMap;
  endpoint: string;
  protocol: SnsProtocol;
};
