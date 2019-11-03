import { KafkaJsOptions } from '../../src/brokers/declarations';
import KafkaJsBrokerAdapter from '../../src/brokers/kafkaJsBrokerAdapter';

describe('Testing the KafkaJsBrokerAdapter', () => {
  it('correctly instantiates with options', () => {
    const kafkaBrokerOptions: KafkaJsOptions = {
      topics: {
        player: {
          numPartitions: 1,
          replicationFactor: 1,
          topic: 'company.events.application.player',
        },
      },
    };

    const kafkaBroker = new KafkaJsBrokerAdapter(['localhost:9092'], kafkaBrokerOptions);

    expect(kafkaBroker).toBeInstanceOf(KafkaJsBrokerAdapter);
  });
});
