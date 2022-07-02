import http, {Server} from 'http';
import { SnsProtocol } from '../../src/brokers/declarations';
import SnsBrokerAdapter from '../../src/brokers/snsBrokerAdapter';
import CloudEventFactory from '../../src/events/cloudEventFactory';
import AWS from 'aws-sdk';

AWS.config.region = 'eu-west-1';

jest.setTimeout(25000); // eslint-disable-line

const getSnsPath = '/sns';

describe('Testing the SnsBrokerAdapter', () => {
  let server: Server;

  beforeEach( (done) => {
    server = http.createServer( (_, res) => {
      res.end();
    });

    server.listen(3050, () => {
      console.log('Server is running at 3050');
      done();
    });
  });

  afterEach( (done) => {
    setTimeout(() => {
      server.close();
      done();
    }, 100);
  });

  const topics = {
    user: {
      topic: 'company_events_identity_user',
    },
  };

  describe('Testing also the Topic subscription', () => {
    it('correctly creates a consumer and sends an event when creating a Topic', (done) => {
      console.log(`getConsumerHost is ${getConsumerHost()} in ${process.env.NODE_ENV} env`);

      const consumerUrl = `http://${getConsumerHost()}:3050${getSnsPath}`;
      const aggregate = 'user';
      const eventType = 'UserCreated';
      const data = {
        email: 'voodoo@gmail.com',
        username: 'Voodoo',
      };

      console.log(consumerUrl);

      const broker = new SnsBrokerAdapter({
        awsAccountId: '000000000000',
        endpoint: 'http://localhost:4566',
        region: 'eu-west-1',
        topics
      });

      broker.init({
        accessKeyId: 'dummyAccessKeyId',
        createTopics: true,
        secretAccessKey: 'dummySecretAccessKey',
      })
        .then(() => {
          // Add a request listener to the Server to consume the messages
          addListener(server, done);

          // Bind the Server to SNS to act as a consumer
          broker.addConsumer('user', { endpoint: consumerUrl, protocol: SnsProtocol.HTTP })
            .then(() => {
              // Send an event

              const cloudEvent = CloudEventFactory.createV1(
                aggregate,
                eventType,
                '/users',
                data,
              );

              broker.sendMessage(aggregate, [cloudEvent])
                .then((snsResponses) => {
                  expect(snsResponses[0].MessageId).not.toBeFalsy();
                })
            });
        });
    });
  });

  describe('Without testing also the Topic subscription', () => {
    it(
      'correctly creates a consumer and sends an event when not creating a Topic and providing the awsAccountId',
      (done) => {
        const getPath = '/sns';
        const consumerUrl = `http://${getConsumerHost()}:3050${getPath}`;
        const aggregate = 'user';
        const eventType = 'UserCreated';
        const data = {
          email: 'voodoo@gmail.com',
          username: 'Voodoo',
        };

        const broker = new SnsBrokerAdapter({
          awsAccountId: '000000000000',
          endpoint: 'http://localhost:4566',
          region: 'eu-west-1',
          topics
        });

        broker.init({
          accessKeyId: 'dummyAccessKeyId',
          createTopics: false,
          secretAccessKey: 'dummySecretAccessKey',
        })
          .then(() => {
            // Add a request listener to the Server to consume the messages
            addListener(server, done);

            // Bind the Server to SNS to act as a consumer
            broker.addConsumer('user', { endpoint: consumerUrl, protocol: SnsProtocol.HTTP })
              .then(() => {
                // Send an event

                const cloudEvent = CloudEventFactory.createV1(
                  aggregate,
                  eventType,
                  '/users',
                  data,
                );

                broker.sendMessage(aggregate, [cloudEvent])
                  .then((snsResponses) => {
                    expect(snsResponses[0].MessageId).not.toBeFalsy();
                  })
              });
          });
      });

    it(
      'correctly creates a consumer and sends an event when not creating a Topic and without awsAccountId',
      (done) => {
        const getPath = '/sns';
        const consumerUrl = `http://${getConsumerHost()}:3050${getPath}`;
        const aggregate = 'user';
        const eventType = 'UserCreated';
        const data = {
          email: 'voodoo@gmail.com',
          username: 'Voodoo',
        };

        const broker = new SnsBrokerAdapter({
          endpoint: 'http://localhost:4566',
          region: 'eu-west-1',
          topics
        });

        broker.init({
          accessKeyId: 'dummyAccessKeyId',
          createTopics: false,
          secretAccessKey: 'dummySecretAccessKey',
        })
          .then(() => {
            // Add a request listener to the Server to consume the messages
            addListener(server, done);

            // Bind the Server to SNS to act as a consumer
            broker.addConsumer('user', { endpoint: consumerUrl, protocol: SnsProtocol.HTTP })
              .then(() => {
                // Send an event

                const cloudEvent = CloudEventFactory.createV1(
                  aggregate,
                  eventType,
                  '/users',
                  data,
                );

                broker.sendMessage(aggregate, [cloudEvent])
                  .then((snsResponses) => {
                    expect(snsResponses[0].MessageId).not.toBeFalsy();
                  });
              });
          });
      });
  });
});

const addListener = (server: http.Server, done: jest.DoneCallback) => {
  server.addListener('request',  (req, res) => {
    const { method, url } = req;

    if (method !== 'POST' || url !== getSnsPath) { return res.end(); }

    const rawBody: Uint8Array[] = [];
    let body: string;

    req.on('data', (chunk: Uint8Array) => {
      rawBody.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(rawBody).toString();

      const message: any = JSON.parse(body);

      try {
        const payload = JSON.parse(message.Message);
        expect(payload.type).toBe('user.UserCreated');
      } catch (e) {
        console.info(message.Message);
        // SNS would require to visit the URL provided in the link to confirm the subscription
        // However, receiving this message is enough to confirm the subscription is working fine
      }

      res.end();
      done();
    });
  });
}

const getConsumerHost = () => process.env.NODE_ENV === 'ci'
  ? '172.17.0.1'
  : 'host.docker.internal';

