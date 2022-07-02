import {KafkaMessage} from 'kafkajs';
import KafkaJsBrokerAdapter from '../../src/brokers/kafkaJsBrokerAdapter';
import CloudEventFactory from '../../src/events/cloudEventFactory';
import {KafkaJsConsumerConfig} from '../../src/brokers/declarations';

jest.setTimeout(25000); // eslint-disable-line

describe('Testing the KafkaJsBrokerAdapter', () => {
  const topics = {
    user: {
      numPartitions: 1,

      replicationFactor: 1,
      topic: 'company.events.identity.user',
    },
  };

  describe('with eachMessage', () => {
    it('correctly creates a consumer using eachMessage and sends an event', (done) => {
      const aggregate = 'user';
      const eventType = 'UserCreated';
      const data = {
        email: 'voodoo@gmail.com',
        username: 'Voodoo',
      };

      const broker = new KafkaJsBrokerAdapter(['localhost:9092'], { topics });

      broker.init({ groupId: 'my-group' })
        .then(() => {
          // Init complete

          const consumerConfig: KafkaJsConsumerConfig = {
            aggregates: {
              user: {
                // eslint-disable-next-line @typescript-eslint/require-await
                handler: async (message: KafkaMessage) => {
                  const eventPayload = JSON.parse(message.value?.toString() ?? '');
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

          broker.addConsumer([], consumerConfig)
            .then((_consumer) => {
              const cloudEvent = CloudEventFactory.createV1(
                aggregate,
                eventType,
                '/users',
                data,
              );

              setTimeout(async () => {
                await broker.sendMessage(aggregate, [cloudEvent]);
              }, 1000)
            })
        })
    });
  });

  describe('with eachBatch', () => {
    it('correctly creates a consumer using eachBatch and sends an event',  (done) => {
      const aggregate = 'user';
      const eventType = 'UserCreated';
      const data = {
        email: 'voodoo@gmail.com',
        username: 'Voodoo',
      };

      const broker = new KafkaJsBrokerAdapter(['localhost:9092'], { topics });

      broker.init({ groupId: 'my-group' })
        .then(() => {
          // Init complete

          const consumerConfig: KafkaJsConsumerConfig = {
            aggregates: {
              user: {
                // eslint-disable-next-line @typescript-eslint/require-await
                handler: async (message: KafkaMessage) => {
                  const eventPayload = JSON.parse(message.value?.toString() ?? '');
                  expect(eventPayload.data).toEqual(data);
                  done();
                },
                topic: topics.user.topic,
              },
            },
            consumerRunConfig: {
              partitionsConsumedConcurrently: 3,
            },
            useBatches: true,
          };

          broker.addConsumer([], consumerConfig)
            .then((_consumer) => {
              const cloudEvent = CloudEventFactory.createV1(
                aggregate,
                eventType,
                '/users',
                data,
              );

              setTimeout(async () => {
                await broker.sendMessage(aggregate, [cloudEvent]);
              }, 1000)
            })
        });
    });
  });
});
