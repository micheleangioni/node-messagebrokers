export type MessageErrorData = {
  data?: any,
  err: any,
  message: string,
  type?: string,
};

export type SslOptions = {
  key: string,
  cert: string,
  // Necessary only if the server uses a self-signed certificate.
  ca?: string[],
  // Necessary only if the server's cert isn't for "localhost".
  checkServerIdentity?: () => null,
};

type KafkaTopic = {
  partitions: number,
  replicationFactor: number,
  topic: string,
};

export type KafkaTopics = {
  [key: string]: KafkaTopic,
};

export type KafkaBrokerOptions = {
  partitionerType?: number,
  sslOptions?: SslOptions,
  topics?: KafkaTopics,
  uri: string,
};

export type KafkaProducerOptions = {
  partitionerType?: number,
};

export type MessageOptions = {
  partitionKey?: string,
};
