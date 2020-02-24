# Node MessageBrokers

![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/micheleangioni/node-messagebrokers?color=stable&label=version)
[![Build Status](https://api.travis-ci.org/micheleangioni/node-messagebrokers.svg?branch=master)](https://travis-ci.org/micheleangioni/node-messagebrokers)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)

> High level library which abstracts low level Message Brokers clients 
> and enforces the [clouevents](https://cloudevents.io/) standard for the event payload.

**Library still in Beta version and in development**

## Contents

- [Supported Clients](#clients)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Event payload format](#payload)
- [Usage](#usage)
  - [KafkaJs](#usage-kafkajs)
  - [AWS SNS](#usage-sns)
- [Contribution Guidelines](#guidelines)
- [License](#license)

## <a name="clients"></a>Supported Clients

Node MessageBrokers provides adapters for [Apache Kafka](https://kafka.apache.org/)
and [AWS SNS](https://aws.amazon.com/sns/). 

Current supported clients are [KafkaJs](https://github.com/tulios/kafkajs) (default) for Apache Kafka 
and the official [AWS Node Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html)
for AWS SNS.

## <a name="requirements"></a>Requirements

- Node.js v10+

## <a name="installation"></a>Installation

To install Node MessageBrokers, run `npm install --save @micheleangioni/node-messagebrokers`.

## <a name="configuration"></a>Configuration

Node MessageBrokers can be configured by making use of the following environment variables:

- `UNDERLYING_CLIENT`: low level client to use, supported valued:
  - `kafkajs` (**default**): modern Apache Kafka client
  - `awssns`: default AWS SNS client

- `KAFKA_URI`: comma-separated list of Kafka brokers, default `localhost:9092`
- `KAFKA_CLIENT_ID`: client id for the Kafka connection. If not set, a random generated will be used
- `KAFKA_LOG_LEVEL`: set the logging level of the KafkaJs client:
    - 0 = nothing
    - 1 = error
    - 2 = warning
    - 4 = info (default)
    - 5 = debug
- `SNS_ENDPOINT`: optional AWS SNS endpoint, default `undefined`
- `AWS_REGION`: AWS region, default `eu-west-1`

- `SSL_CERT`: SSL certificate
- `SSL_KEY`: SSL key
- `SSL_CA`: SSL certificate authority

- `REVERSE_DNS`: Reverse DNS to customise the `type` field of the event payload

## <a name="payload"></a>Event payload format

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

## <a name="usage"></a>Usage

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

const broker = brokerFactory({ topics });
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

Every client has its own instantiation options as well. 

Furthermore, before being used, most clients need to be initialized through the async `init()` method.
Due to some particularity of each client, the brokers' `init()` methods have different option parameters.

### <a name="usage-kafkajs"></a>KafkaJs

**Instantiation**

```js
import brokerFactory from '@micheleangioni/node-messagebrokers';

// SSL certificate
const sslOptions = {
  ca: '', // TODO To be set
  cert: '', // TODO To be set
  key: '' // TODO To be set
};

const topics = {
  user: {
    topic: 'myCompany.events.identity.user',
    numPartitions: 16,
    replicationFactor: 3,
  }
};

const broker = brokerFactory({ 
  clientId: 'my-app',
  sslOptions,
  topics
});
```

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
const consumer = await broker.addConsumer([], consumerConfig); // the first argument is ignored
```

where `consumerConfig` has the following type signature:

```typescript
export interface IHeaders {
  [key: string]: Buffer | string
}

export type KafkaMessage = {
  key: Buffer
  value: Buffer // Message payload
  timestamp: string
  size: number
  attributes: number
  offset: string
  headers?: IHeaders
}

export type AggregateConsumerConf = {
  handler: (message: KafkaMessage) => Promise<void>;
  fromBeginning?: boolean; // Fetch messages from the beginning of the topic, default false
  topic: string;
};

type KafkaJsConsumerConfig = {
  aggregates: {
    [aggregate: string]: AggregateConsumerConf;
  };
  consumerRunConfig?: {
    autoCommit?: boolean;
    autoCommitInterval?: number | null;
    autoCommitThreshold?: number | null;
    eachBatchAutoResolve?: boolean;
    partitionsConsumedConcurrently?: number; // Number of running concurrent partition handlers, default 1
  };
  useBatches?: boolean; // true: use batches, false (default): use single messages
};
```

Simple example:

```js
const consumer = await broker.addConsumer([], {
  aggregates: {
    user: {
      // eslint-disable-next-line @typescript-eslint/require-await
      handler: async (message: KafkaMessage) => {
        const eventPayload = JSON.parse(message.value.toString());
        expect(eventPayload.data).toEqual(data);
        done();
      },
      topic: 'myCompany.events.identity.user',
    },
  },
  consumerRunConfig: {
    partitionsConsumedConcurrently: 3,
  },
  useBatches: false,
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

### <a name="usage-sns"></a>AWS SNS

**Instantiation**

```js
import brokerFactory from '@micheleangioni/node-messagebrokers';

const broker = brokerFactory({ 
  endpoint: 'http://localhost:4575', 
  region: 'eu-central-1', 
  topics
});
```

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

## <a name="guidelines"></a>Contribution Guidelines

Pull requests are welcome. Help is needed to add other clients.

## <a name="license"></a>License

Node MessageBrokers is free software distributed under the terms of the MIT license.
