import { CloudEventFactory } from '../../src';

process.env.REVERSE_DNS = 'com.football';

describe('Testing the CloudEventFactory', () => {
  const aggregate = 'Player';
  const eventType = 'PlayerCreated';
  const source = '/players';
  const playerData = {
    name: 'Michele',
    shirtNumber: 10,
  };

  it('correctly creates a v1 CloudEvent instance', () => {
    const datacontenttype = 'datacontenttype';
    const dataschema = 'https://myschema.com';
    const subject = '10';

    const event = CloudEventFactory.createV1(aggregate, eventType, source, playerData, {
      datacontenttype,
      dataschema,
      subject,
    });
    const payload = event.toJSON();
    const expectedType = `${process.env.REVERSE_DNS}.${aggregate}.${eventType}`;

    expect(event.specversion).toBe('1.0');
    expect(event.type).toBe(expectedType);
    expect(event.source).toBe(source);
    expect(event.data).toBe(playerData);
    expect(event.dataschema).toBe(dataschema);

    expect(payload.specversion).toBe('1.0');
    expect(payload.source).toBe(source);
    expect(payload.type).toBe(expectedType);
    expect(payload.data).toBe(playerData);
    expect(payload.datacontenttype).toBe(datacontenttype);
    expect(payload.subject).toBe(subject);
  });
});
