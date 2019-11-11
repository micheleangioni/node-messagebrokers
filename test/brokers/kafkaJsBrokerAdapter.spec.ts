import {Consumer} from 'kafkajs';
import KafkaJsBrokerAdapter from '../../src/brokers/kafkaJsBrokerAdapter';
import CloudEventFactory from '../../src/events/cloudEventFactory';

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

    consumer = await broker.addConsumer(topics.user.topic, {
      eachMessage: async (payload) => {
        expect(payload.topic).toBe(topics.user.topic);
        expect(payload.message.value.toString() === topics.user.topic);
        const eventPayload = JSON.parse(payload.message.value.toString());
        expect(eventPayload.data).toEqual(data);
        done();
      },
      fromBeginning: true,
    });

    const cloudEvent = CloudEventFactory.create(
      aggregate,
      eventType,
      '/users',
      data,
    );

    await broker.sendMessage(aggregate, [cloudEvent]);
  });
});
