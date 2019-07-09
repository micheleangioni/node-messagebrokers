import { KafkaBrokerOptions } from '../../src/brokers/declarations';
import KafkaBrokerAdapter from '../../src/brokers/kafkaBrokerAdapter';

describe('Testing the KafkaBrokerAdapter', () => {
  it('correctly instantiates with options', () => {
    const kafkaBrokerOptions: KafkaBrokerOptions = {
      partitionerType: 3,
      topics: {
        player: {
          partitions: 2,
          replicationFactor: 1,
          topic: 'company.events.application.player',
        },
      },
      uri: 'localhost:9092',
    };

    const kafkaBroker = new KafkaBrokerAdapter(kafkaBrokerOptions);

    expect(kafkaBroker).toBeInstanceOf(KafkaBrokerAdapter);
  });
});
