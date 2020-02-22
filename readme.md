# Node MessageBrokers

[![Build Status](https://api.travis-ci.org/micheleangioni/node-messagebrokers.svg?branch=master)](https://travis-ci.org/micheleangioni/node-messagebrokers)

> High level library which abstracts low level Message Brokers clients 
> and enforces the [clouevents](https://cloudevents.io/) standard for the event payload.

**Library still in Beta version and in development**

## Supported Clients

Node MessageBrokers provides adapters for [Apache Kafka](https://kafka.apache.org/)
and [AWS SNS](https://aws.amazon.com/sns/). 

Current supported clients are [KafkaJs](https://github.com/tulios/kafkajs) (default) for Apache Kafka 
and the official [AWS Node Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html)
for AWS SNS.

## Requirements

- Node.js v10+

## Installation

To install Node MessageBrokers, run `npm install --save @micheleangioni/node-messagebrokers`.

## Configuration

Node MessageBrokers can be configured by making use of the following environment variables:

- `UNDERLYING_CLIENT`: low level client to use, supported valued:
  - `kafkajs` (**default**): modern Apache Kafka client
  - `awssns`: default AWS SNS client

- `KAFKA_URI`: comma-separated list of Kafka brokers, default `localhost:9092`
- `SNS_ENDPOINT`: optional AWS SNS endpoint, default `undefined`
- `AWS_REGION`: AWS region, default `eu-west-1`

- `SSL_CERT`: SSL certificate
- `SSL_KEY`: SSL key
- `SSL_CA`: SSL certificate authority

- `REVERSE_DNS`: Reverse DNS to customise the `type` field of the event payload

## Event payload format

In order to send an event, the payload must follow the [cloudevents](https://cloudevents.io/) format.

Node MessageBrokers exposes an event factory for v1.0 of the standard.
In order to use it, import the factory

```js
import { CloudEventFactory } from '@micheleangioni/node-messagebrokers';
```

and use the `createV1` factory method

```typescript
CloudEventFactory.createV1(
  aggregate: string,
  eventType: string,
  source: string,
  data: any,
  options: CreateEventV1Options = {},
)
```

where `CreateEventV1Options` is as follows

```typescript
export type CreateEventV1Options = {
  datacontenttype?: string, // default 'application/json'
  dataschema?: string,
  subject?: string,
};
```

## Usage

**Instantiating a Client**

Instantiation is the same for all clients.
In order to create an instance, it's enough to provide the topic list when using the client factory:

```js
import brokerFactory from '@micheleangioni/node-messagebrokers';

const topics = {
  user: {
    topic: 'myCompany.events.identity.user',
    (numPartitions: 2),
    (replicationFactor: 1),
  }
};

const broker = brokerFactory(topics);
```

The `topics` parameter must follow the following type definition:

```typescript
type KafkaTopic = {
  topic: string
  numPartitions?: number // Only for Apache Kafka clients
  replicationFactor?: number // Only for Apache Kafka clients
  replicaAssignment?: object[] // Only for KafkaJs client
  configEntries?: object[],  // Only for KafkaJs client
};

type KafkaTopics = {
  [aggregate: string]: KafkaTopic,
};
```

This structure enforces to provide a different topic per [Aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html).

Before being used, most clients need to be initialized through the async `init()` method.
Due to some particularity of each client, the brokers' `init()` methods have different option parameters.

### KafkaJs

**Initialization**

```js
await broker.init(consumerConfig);
```

where `consumerConfig` has the following signature:

```typescript
export interface RetryOptions {
  maxRetryTime?: number
  initialRetryTime?: number
  factor?: number
  multiplier?: number
  retries?: number
}

interface ConsumerConfig {
  groupId: string
  metadataMaxAge?: number
  sessionTimeout?: number
  rebalanceTimeout?: number
  heartbeatInterval?: number
  maxBytesPerPartition?: number
  minBytes?: number
  maxBytes?: number
  maxWaitTimeInMs?: number
  retry?: RetryOptions
  allowAutoTopicCreation?: boolean
  maxInFlightRequests?: number
  readUncommitted?: boolean
}
```

Simple example

```js
await broker.init({ groupId: 'my-consumer-group-id' });
```

**Creating a Consumer**

```js
const consumer = await broker.addConsumer(topic, consumerConfig);
```

where `consumerConfig` has the following type signature:

```typescript
interface IHeaders {
  [key: string]: Buffer
}

type KafkaMessage = {
  key: Buffer
  value: Buffer
  timestamp: string
  size: number
  attributes: number
  offset: string
  headers?: IHeaders
}

interface EachMessagePayload {
  topic: string
  partition: number
  message: KafkaMessage
}

type Batch = {
  topic: string
  partition: number
  highWatermark: string
  messages: KafkaMessage[]
  isEmpty(): boolean
  firstOffset(): string | null
  lastOffset(): string
  offsetLag(): string
  offsetLagLow(): string
}

interface PartitionOffset {
  partition: number
  offset: string
}

interface TopicOffsets {
  topic: string
  partitions: PartitionOffset[]
}

interface Offsets {
  topics: TopicOffsets[]
}

interface OffsetsByTopicPartition {
  topics: TopicOffsets[]
}

interface EachBatchPayload {
  batch: Batch
  resolveOffset(offset: string): void
  heartbeat(): Promise<void>
  commitOffsetsIfNecessary(offsets?: Offsets): Promise<void>
  uncommittedOffsets(): Promise<OffsetsByTopicPartition>
  isRunning(): boolean
  isStale(): boolean
}

type KafkaJsConsumerConfig = {
  autoCommit?: boolean,
  autoCommitInterval?: number | null,
  autoCommitThreshold?: number | null,
  eachBatchAutoResolve?: boolean,
  fromBeginning?: boolean,
  partitionsConsumedConcurrently?: number,
  eachBatch?: (payload: EachBatchPayload) => Promise<void>,
  eachMessage?: (payload: EachMessagePayload) => Promise<void>,
};
```

Simple example:

```js
const consumer = await broker.addConsumer('myCompany.events.user-management.user', {
  eachMessage: async (payload) => {
    console.log(`Incoming message from topic ${payload.topic} and partition ${payload.partition}`);
    console.log(payload.message);
  },
  fromBeginning: true,
});
```

**Sending messages**

```js
const cloudEvent = CloudEventFactory.createV1(
  aggregate,
  eventType,
  source,
  data,
);

await broker.sendMessage(
  aggregate,
  [cloudEvent],
  { partitionKey },
)
```

Simple example:

```js
const aggregate = 'user';

const cloudEvent = CloudEventFactory.createV1(
  aggregate,
  'UserCreated',
  '/users',
  {
    email: 'voodoo@gmail.com',
    username: 'Voodoo',
  },
);

await broker.sendMessage(
  aggregate,
  [cloudEvent],
)
```

### AWS SNS

**Initialization**

```js
await broker.init(initConfigurations);
```

where `initConfigurations` is optional and has the same structure of the 
[options constructor parameter of the official SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html#constructor-property).

Simple example:

```js
await broker.init();
```

**Adding a Consumer**

```js
const subscriptionResponse = await addConsumer(aggregate, consumerConfig);
```

where `aggregate` is a string and `consumerConfig` has the following signature

```typescript
type SnsConsumerOptions = {
  attributes?: SubscriptionAttributesMap,
  endpoint: string,
  protocol: SnsProtocol,
};
```

where `endpoint` is the endpoint to which the consumer can be reached, 
`SnsProtocol` is one of the supporter SNS protocols

```typescript
enum SnsProtocol {
  EMAIL = 'email',
  EMAIL_JSON = 'email-json',
  HTTP = 'http',
  HTTPS = 'https',
  SMS = 'sms',
  SQS = 'sqs',
  APPLICATION = 'application',
  LAMBDA = 'lambda',
}
```

and `SubscriptionAttributesMap` is one of the 
[attributes of the official SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html#subscribe-property).

Simple example for an HTTP consumer:

```js
await broker.addConsumer('user', { endpoint: 'https://myconsumerhost.com/api/example', protocol: SnsProtocol.HTTP });
```

**Sending messages**

```js
const cloudEvent = CloudEventFactory.createV1(
  aggregate,
  eventType,
  source,
  data,
);

await broker.sendMessage(
  aggregate,
  [cloudEvent],
)
```

Simple example:

```js
const aggregate = 'user';

const cloudEvent = CloudEventFactory.createV1(
  aggregate,
  'UserCreated',
  '/users',
  {
    email: 'voodoo@gmail.com',
    username: 'Voodoo',
  },
);

await broker.sendMessage(
  aggregate,
  [cloudEvent],
)
```

## Contribution Guidelines

Pull requests are welcome. Help is needed to add other clients.

## License

Node MessageBrokers is free software distributed under the terms of the MIT license.
