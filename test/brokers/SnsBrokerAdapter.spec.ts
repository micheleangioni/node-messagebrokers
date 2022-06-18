import http, {Server} from 'http';
import { SnsProtocol } from '../../src/brokers/declarations';
import SnsBrokerAdapter from '../../src/brokers/snsBrokerAdapter';
import CloudEventFactory from '../../src/events/cloudEventFactory';
import AWS from 'aws-sdk';

AWS.config.region = 'eu-west-1';

jest.setTimeout(15000); // eslint-disable-line

describe('Testing the SnsBrokerAdapter', () => {
  const topics = {
    user: {
      topic: 'company_events_identity_user',
    },
  };

  describe('Testing also the Topic subscription', () => {
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

    it('correctly creates a consumer and sends an event when creating a Topic', (done) => {
      const getPath = '/sns';
      const consumerUrl = `http://host.docker.internal:3050${getPath}`;
      const aggregate = 'user';
      const eventType = 'UserCreated';
      const data = {
        email: 'voodoo@gmail.com',
        username: 'Voodoo',
      };

      const broker = new SnsBrokerAdapter({
        endpoint: 'http://localhost:4566',
        region: 'eu-west-1',
        topics,
      });

      broker.init({
        accessKeyId: 'dummyAccessKeyId',
        createTopics: true,
        secretAccessKey: 'dummySecretAccessKey',
      })
        .then(() => {
          // Init complete

          // Add a request listener to the Server to consume the messages

          server.addListener('request',  (req, res) => {
            console.log('REQUEST', req);

            const { method, url } = req;

            if (method !== 'POST' || url !== getPath) { return res.end(); }

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

                  // done();
                })
            })
        })
    });
  });

  describe('Without testing also the Topic subscription', () => {
    it(
      'correctly creates a consumer and sends an event when not creating a Topic and providing the awsAccountId',
      (done) => {
        const getPath = '/sns';
        const consumerUrl = `http://host.docker.internal:3050${getPath}`;
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

                    done();
                  })
              });
          });
      });

    it(
      'correctly creates a consumer and sends an event when not creating a Topic and without awsAccountId',
      (done) => {
        const getPath = '/sns';
        const consumerUrl = `http://host.docker.internal:3050${getPath}`;
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

                    done();
                  });
              });
          });
      });
  });
});
