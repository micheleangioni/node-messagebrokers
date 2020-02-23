import {Consumer} from 'kafkajs';
import KafkaJsBrokerAdapter from '../../src/brokers/kafkaJsBrokerAdapter';
import CloudEventFactory from '../../src/events/cloudEventFactory';
import {KafkaJsConsumerConfig} from '../../src/brokers/declarations';

jest.setTimeout(10000); // eslint-disable-line

describe('Testing the KafkaJsBrokerAdapter', () => {
  let consumer: Consumer;

  afterEach(async (done) => {
    if (consumer) {
      await consumer.disconnect();
    }

    done();
  });

  const topics = {
    user: {
      numPartitions: 1,
      replicationFactor: 1,
      topic: 'company.events.identity.user',
    },
  };

  it('correctly creates a consumer and sends an event', async (done) => {
    const aggregate = 'user';
    const eventType = 'UserCreated';
    const data = {
      email: 'voodoo@gmail.com',
      username: 'Voodoo',
    };

    const broker = new KafkaJsBrokerAdapter(['localhost:9092'], { topics });
    await broker.init({ groupId: 'my-group' });

    const consumerConfig: KafkaJsConsumerConfig = {
      aggregates: {
        user: {
          // eslint-disable-next-line @typescript-eslint/require-await
          eachMessage: async (payload: any) => {
            const eventPayload = JSON.parse(payload.value.toString());
            expect(eventPayload.data).toEqual(data);
            done();
          },
          topic: topics.user.topic,
        },
      },
      consumerRunConfig: {
        partitionsConsumedConcurrently: 3,
      },
      useBatches: false,
    };

    consumer = await broker.addConsumer([], consumerConfig);

    const cloudEvent = CloudEventFactory.createV1(
      aggregate,
      eventType,
      '/users',
      data,
    );

    await broker.sendMessage(aggregate, [cloudEvent]);
  });
});
