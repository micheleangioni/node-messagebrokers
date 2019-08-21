import fs from 'fs';
import path from 'path';
import KafkaAdapter from './kafkaBrokerAdapter';

import { KafkaBrokerOptions } from './index';

const kafkaOptions: KafkaBrokerOptions = {
  topics: config.kafka.topics,
};

if (process.env.NODE_ENV === 'staging') {
  kafkaOptions.sslOptions = {
    // Necessary only if the server requires client certificate authentication.
    cert: fs.readFileSync(path.join(__dirname, '../resources/kafka/kafka-service-stage.cert')),
    key: fs.readFileSync(path.join(__dirname, '../resources/kafka/kafka-service-stage.key')),

    // Necessary only if the server uses a self-signed certificate.
    ca: [ fs.readFileSync(path.join(__dirname, '../resources/kafka/kafka-ca-stage.pem')) ],

    // Necessary only if the server's cert isn't for "localhost".
    checkServerIdentity: () => null,
  };
}

if (process.env.NODE_ENV === 'production') {
  kafkaOptions.sslOptions = {
    // Necessary only if the server requires client certificate authentication.
    cert: fs.readFileSync(path.join(__dirname, '../resources/kafka/kafka-service-production.cert')),
    key: fs.readFileSync(path.join(__dirname, '../resources/kafka/kafka-service-production.key')),

    // Necessary only if the server uses a self-signed certificate.
    ca: [ fs.readFileSync(path.join(__dirname, '../resources/kafka/kafka-ca-production.pem')) ],

    // Necessary only if the server's cert isn't for "localhost".
    checkServerIdentity: () => null,
  };
}

const kafkaBroker = new KafkaAdapter(config.kafka.uri, kafkaOptions);

if (['test', 'testing', 'ci'].includes(process.env.NODE_ENV || '')) {
  kafkaBroker.init = async () => true;
  kafkaBroker.sendMessage = async () => [];
}

export default kafkaBroker;
