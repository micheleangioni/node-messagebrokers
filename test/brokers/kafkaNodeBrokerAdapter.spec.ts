import { KafkaNodeOptions } from '../../src/brokers/declarations';
import KafkaNodeBrokerAdapter from '../../src/brokers/kafkaNodeBrokerAdapter';

describe('Testing the KafkaNodeBrokerAdapter', () => {
  it('correctly instantiates with options', () => {
    const kafkaBrokerOptions: KafkaNodeOptions = {
      partitionerType: 3,
      topics: {
        user: {
          partitions: 2,
          replicationFactor: 1,
          topic: 'company.events.identity.user',
        },
      },
    };

    const kafkaBroker = new KafkaNodeBrokerAdapter(['localhost:9092'], kafkaBrokerOptions);

    expect(kafkaBroker).toBeInstanceOf(KafkaNodeBrokerAdapter);
  });
});
