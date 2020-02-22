import {SubscriptionAttributesMap} from 'aws-sdk/clients/sns';
import {EachBatchPayload, EachMessagePayload} from 'kafkajs';

export type SslOptions = {
  ca?: string[];
  cert: string;
  key: string;
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

export type KafkaJsConsumerConfig = {
  autoCommit?: boolean;
  autoCommitInterval?: number | null;
  autoCommitThreshold?: number | null;
  eachBatchAutoResolve?: boolean;
  fromBeginning?: boolean;
  partitionsConsumedConcurrently?: number;
  eachBatch?: (payload: EachBatchPayload) => Promise<void>;
  eachMessage?: (payload: EachMessagePayload) => Promise<void>;
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

export type KafkaNodeConsumerPayload = {
  offset?: number;
  partition?: number;
  topic: string;
};

export type KafkaNodeConsumerPayloads = KafkaNodeConsumerPayload[];

export type KafkaNodeSslOptions = SslOptions & {
  checkServerIdentity?: () => null;
};

type KafkaNodeTopic = {
  partitions: number;
  replicationFactor: number;
  topic: string;
};

export type KafkaNodeTopics = {
  [key: string]: KafkaNodeTopic;
};

export type KafkaNodeOptions = {
  partitionerType?: number;
  sslOptions?: SslOptions;
  topics?: KafkaNodeTopics;
};

export type MessageOptions = {
  partitionKey?: string;
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
