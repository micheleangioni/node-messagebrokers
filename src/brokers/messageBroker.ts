import {KafkaNodeTopics, KafkaTopics, SslOptions} from './declarations';
import IBrokerInterface from './IBrokerInterface';
import KafkaJsAdapter from './kafkaJsBrokerAdapter';
import KafkaNodeBrokerAdapter from './kafkaNodeBrokerAdapter';

enum KafkaClients {
  KAFKANODE = 'kafkanode',
  KAFKAJS = 'kafkajs',
}

const kafkaClientType = process.env.KAFKA_CLIENT || 'kafkajs';

function getSSLConfiguration(): SslOptions|undefined {
  if (process.env.KAFKA_SSL_CERT && process.env.KAFKA_SSL_KEY) {
    const sslOptions: SslOptions = {
      cert: process.env.KAFKA_SSL_CERT,
      key: process.env.KAFKA_SSL_KEY,
    };

    if (process.env.KAFKA_SSL_CA) {
      sslOptions.ca = [process.env.KAFKA_SSL_CA];
    }

    return sslOptions;
  }

  return undefined;
}

export default (topics: KafkaTopics) => {
  const kafkaBrokerList = process.env.KAFKA_URI
    ? process.env.KAFKA_URI.split(',')
    : ['localhost:9092'];
  const sslOptions = getSSLConfiguration();

  let kafkaBroker: IBrokerInterface;

  switch (kafkaClientType) {
    case KafkaClients.KAFKAJS: {
      kafkaBroker = new KafkaJsAdapter(kafkaBrokerList, { sslOptions, topics });
      break;
    }
    case KafkaClients.KAFKANODE: {
      const convertedTopics: KafkaNodeTopics = Object.keys(topics)
        .reduce((kafkaNodeTopics: KafkaNodeTopics, aggregateName) => {
          kafkaNodeTopics[aggregateName] = {
            partitions: topics[aggregateName].numPartitions || 1,
            replicationFactor: topics[aggregateName].replicationFactor || 1,
            topic: topics[aggregateName].topic,
          };

          return kafkaNodeTopics;
        }, {});

      kafkaBroker = new KafkaNodeBrokerAdapter(kafkaBrokerList, {
        sslOptions,
        topics: convertedTopics,
      });
      break;
    }
    default:
      throw new Error(`Invalid Kafka Client: ${kafkaClientType}`);
  }

  return kafkaBroker;
};
