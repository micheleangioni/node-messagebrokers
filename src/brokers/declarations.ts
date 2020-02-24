import {SubscriptionAttributesMap} from 'aws-sdk/clients/sns';
import {KafkaMessage} from 'kafkajs';

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

export type KafkaJsTopic = {
  topic: string;
  numPartitions?: number;
  replicationFactor?: number;
  replicaAssignment?: object[];
  configEntries?: object[];
};

export type KafkaJsTopics = {
  [aggregate: string]: KafkaJsTopic;
};

export type KafkaTopic = {
  topic: string;
  numPartitions?: number;
  replicationFactor?: number;
  replicaAssignment?: object[];
  configEntries?: object[];
};

export type KafkaTopics = {
  [aggregate: string]: KafkaTopic;
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

export type AggregateConsumerConf = {
  handler: (message: KafkaMessage) => Promise<void>;
  fromBeginning?: boolean;
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
  data?: any;
  err: any;
  message: string;
  type?: string;
};

export type AggregatesTopicArns = {
  [aggregate: string]: string;
};

export type SnsOptions = {
  endpoint?: string;
  region?: string;
  topics: KafkaTopics;
};

export enum SnsProtocol {
  EMAIL = 'email',
  EMAIL_JSON = 'email-json',
  HTTP = 'http',
  HTTPS = 'https',
  SMS = 'sms',
  SQS = 'sqs',
  APPLICATION = 'application',
  LAMBDA = 'lambda',
}

export type SnsConsumerOptions = {
  attributes?: SubscriptionAttributesMap;
  endpoint: string;
  protocol: SnsProtocol;
};
