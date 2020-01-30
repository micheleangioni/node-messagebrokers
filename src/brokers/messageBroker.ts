import {KafkaNodeTopics, KafkaTopics, SslOptions} from './declarations';
import IBrokerInterface from './IBrokerInterface';
import KafkaJsAdapter from './kafkaJsBrokerAdapter';
import KafkaNodeBrokerAdapter from './kafkaNodeBrokerAdapter';
import SnsBrokerAdapter from './snsBrokerAdapter';

enum Clients {
  KAFKANODE = 'kafkanode',
  KAFKAJS = 'kafkajs',
  SNS = 'awssns',
}

const client = process.env.UNDERLYING_CLIENT || Clients.KAFKAJS;

function getSSLConfiguration(): SslOptions|undefined {
  if (process.env.SSL_CERT && process.env.SSL_KEY) {
    const sslOptions: SslOptions = {
      cert: process.env.SSL_CERT,
      key: process.env.SSL_KEY,
    };

    if (process.env.SSL_CA) {
      sslOptions.ca = [process.env.SSL_CA];
    }

    return sslOptions;
  }

  return undefined;
}

function getKafkaBrokerList(): string[] {
  return process.env.KAFKA_URI
    ? process.env.KAFKA_URI.split(',')
    : ['localhost:9092'];
}

export default (topics: KafkaTopics) => {
  const sslOptions = getSSLConfiguration();

  let messageBroker: IBrokerInterface;

  switch (client) {
    case Clients.KAFKAJS: {
      messageBroker = new KafkaJsAdapter(getKafkaBrokerList(), { sslOptions, topics });
      break;
    }
    case Clients.KAFKANODE: {
      const convertedTopics: KafkaNodeTopics = Object.keys(topics)
        .reduce((kafkaNodeTopics: KafkaNodeTopics, aggregateName) => {
          kafkaNodeTopics[aggregateName] = {
            partitions: topics[aggregateName].numPartitions || 1,
            replicationFactor: topics[aggregateName].replicationFactor || 1,
            topic: topics[aggregateName].topic,
          };

          return kafkaNodeTopics;
        }, {});

      messageBroker = new KafkaNodeBrokerAdapter(getKafkaBrokerList(), {
        sslOptions,
        topics: convertedTopics,
      });
      break;
    }
    case Clients.SNS: {
      messageBroker = new SnsBrokerAdapter({
        region: process.env.AWS_REGION || 'eu-west-1',
        topics,
        ...(process.env.SNS_ENDPOINT && { endpoint: process.env.SNS_ENDPOINT }),
      });
      break;
    }
    default:
      throw new Error(`Invalid Client: ${client}`);
  }

  return messageBroker;
};
