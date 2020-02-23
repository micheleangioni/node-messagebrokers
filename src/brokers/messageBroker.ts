import {KafkaTopics, SslOptions} from './declarations';
import IBrokerInterface from './IBrokerInterface';
import KafkaJsAdapter from './kafkaJsBrokerAdapter';
import SnsBrokerAdapter from './snsBrokerAdapter';

enum Clients {
  KAFKAJS = 'kafkajs',
  SNS = 'awssns',
}

const client = process.env.UNDERLYING_CLIENT || Clients.KAFKAJS;

const getSSLConfiguration = (): SslOptions | undefined => {
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
};

const getKafkaBrokerList = (): string[] => {
  return process.env.KAFKA_URI
    ? process.env.KAFKA_URI.split(',')
    : ['localhost:9092'];
};

export default (topics: KafkaTopics) => {
  const sslOptions = getSSLConfiguration();

  let messageBroker: IBrokerInterface;

  switch (client) {
    case Clients.KAFKAJS: {
      messageBroker = new KafkaJsAdapter(getKafkaBrokerList(), {
        ...(process.env.KAFKA_CLIENT_ID && { clientId: process.env.KAFKA_CLIENT_ID }),
        sslOptions,
        topics,
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
