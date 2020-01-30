import http, {Server} from 'http';
import {SnsProtocol} from '../../src/brokers/declarations';
import SnsBrokerAdapter from '../../src/brokers/snsBrokerAdapter';
import CloudEventFactory from '../../src/events/cloudEventFactory';

jest.setTimeout(10000); // eslint-disable-line

describe('Testing the SnsBrokerAdapter', () => {
  let server: Server;

  beforeEach(async (done) => {
    server = http.createServer( (req, res) => {
      res.end();
    });

    server.listen(8080,  async () => {
      console.log('Server is running at 8080');
      done();
    });
  });

  afterEach(async (done) => {
    server.close();
    done();
  });

  const topics = {
    user: {
      topic: 'company_events_identity_user',
    },
  };

  it('correctly creates a consumer and sends an event', async (done) => {
    const getPath = '/sns';
    const consumerUrl = `http://localhost:8080${getPath}`;
    const aggregate = 'user';
    const eventType = 'UserCreated';
    const data = {
      email: 'voodoo@gmail.com',
      username: 'Voodoo',
    };

    const broker = new SnsBrokerAdapter({ endpoint: 'http://localhost:4575', region: 'eu-central-1', topics });
    await broker.init({
      accessKeyId: 'dummyAccessKeyId',
      secretAccessKey: 'dummySecretAccessKey',
    });

    // Add a request listener to the Server to consume the messages

    server.addListener('request', async (req, res) => {
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
          console.error(e.message);
          console.error(message.Message);
          // Error parsing the message, make Jest fail
          expect(message.Message).toBe('user.UserCreated');
        }

        res.end();
        done();
      });
    });

    // Bind the Server to SNS to act as a consumer
    await broker.addConsumer('user', { endpoint: consumerUrl, protocol: SnsProtocol.HTTP });

    // Send an event

    const cloudEvent = CloudEventFactory.createV1(
      aggregate,
      eventType,
      '/users',
      data,
    );

    await broker.sendMessage(aggregate, [cloudEvent]);
  });
});
