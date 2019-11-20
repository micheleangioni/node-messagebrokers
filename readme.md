# Node MessageBrokers

> High level library which abstracts low level Message Brokers clients 
> and enforces the [clouevents](https://cloudevents.io/) standard for the event payload.

**Library still in Beta version and in development**

## Supported Clients

At the present status, Node MessageBrokers provides adapters only for [Apache Kafka](https://kafka.apache.org/).

Current supported clients are [KafkaJs](https://github.com/tulios/kafkajs) (default and recommended) 
and [Kafka-node](https://github.com/SOHU-Co/kafka-node).

## Requirements

- Node.js v10+

## Installation

To install Node MessageBrokers, run `npm install --save @micheleangioni/node-messagebrokers`.

## Configuration

Node MessageBrokers can be configured by making use of the following environment variables:

- `UNDERLYING_CLIENT`: low level client to use, supported valued:
  - `kafkajs` (**default**): modern Apache Kafka client
  - `kafkanode`: battle-tested Apache Kafka client

- `KAFKA_URI`: comma-separated list of Kafka brokers, default `localhost:9092`

- `SSL_CERT`: SSL certificate
- `SSL_KEY`: SSL key
- `SSL_CA`: SSL certificate authority

- `REVERSE_DNS`: Reverse DNS to customise the `type` field of the event payload

## Event payload format

In order to send an event, the payload must follow the [clouevents](https://cloudevents.io/) format.

Node MessageBrokers exposes an event factory for v0.3 and v0.2 of the format.
In order to use it, import the factory

```js
import { CloudEventFactory } from 'node-messagebrokers';
```

and use the `createV03` factory method for v0.3

```typescript
CloudEventFactory.createV03(
  aggregate: string,
  eventType: string,
  source: string,
  data: any,
  options: CreateEventV03Options = {},
)
```

where `CreateEventV03Options` is as follows

```typescript
export type CreateEventV03Options = {
  contentType?: string,
  schemaurl?: string,
  datacontentencoding?: string,
  datacontenttype?: string,
  subject?: string,
};
```

and the `createV02` factory method for v0.2

```typescript
CloudEventFactory.createV02(
  aggregate: string,
  eventType: string,
  source: string,
  data: any,
  options: CreateEventV02Options = {},
)
```

where `CreateEventV02Options` is as follows

```typescript
export type CreateEventV02Options = {
  contentType?: string,
  schemaurl?: string,
};
```

## Usage

**Instantiating a Client**

Instantiation is equal for all clients.
In order to create an instance, it's enough to provide the topic list when using the client factory:

```js
import brokerFactory from 'node-messagebrokers';

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
  numPartitions?: number
  replicationFactor?: number
  replicaAssignment?: object[] // Only for KafkaJs client
  configEntries?: object[],  // Only for KafkaJs client
};

type KafkaTopics = {
  [aggregate: string]: KafkaTopic,
};
```

This structure enforces to provide a different topic per [Aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html).

Before being used, most clients need to be initialized through the async `init()` method.
Due to some particularity of each client, most broker methods have different option parameters.

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
await broker.init(consumerConfig);
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
const cloudEvent = CloudEventFactory.createV03(
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

const cloudEvent = CloudEventFactory.createV03(
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

### Kafka-node

**Initialization**

```js
await broker.init();
```

**Creating a Consumer**

```js
const consumer = await broker.addConsumer(topic, handler);
```

where `handler` has the following signature

```typescript
type Handler = (message: unknown) => void;
```

Simple example:

```js
const consumer = await broker.addConsumer('myCompany.events.user-management.user', (message) => {
  const parsedValue = JSON.parse((message as KafkaMessage).value);
  console.log('Received message from topic `myCompany.events.user-management.user`');
  console.log(parsedValue);
});
```

**Sending messages**

```js
const aggregate = 'user';

const cloudEvent = CloudEventFactory.factory(
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
