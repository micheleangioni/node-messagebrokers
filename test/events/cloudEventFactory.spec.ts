// @ts-ignore
import Cloudevent, { Spec02Payload, Spec03Payload } from 'cloudevents-sdk';
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

  it('correctly creates a v0.3 CloudEvent instance', () => {
    const datacontentencoding = 'base64';
    const datacontenttype = 'datacontenttype';
    const schemaurl = 'https://myschema.com';
    const subject = '10';

    const event = CloudEventFactory.createV03(aggregate, eventType, source, playerData, {
      datacontentencoding,
      datacontenttype,
      schemaurl,
      subject,
    });
    const payload = event.format() as Spec03Payload;
    const expectedType = `${process.env.REVERSE_DNS}.${aggregate}.${eventType}`;

    expect(event).toBeInstanceOf(Cloudevent);
    expect(event.getSpecversion()).toBe('0.3');
    expect(event.getType()).toBe(expectedType);
    expect(event.getSource()).toBe(source);
    expect(event.getData()).toBe(playerData);
    expect(event.getSchemaurl()).toBe(schemaurl);

    expect(payload.specversion).toBe('0.3');
    expect(payload.source).toBe(source);
    expect(payload.type).toBe(expectedType);
    expect(payload.data).toBe(playerData);
    expect(payload.datacontentencoding).toBe(datacontentencoding);
    expect(payload.datacontenttype).toBe(datacontenttype);
    expect(payload.subject).toBe(subject);
  });

  it('correctly creates a v0.2 CloudEvent instance', () => {
    const schemaurl = 'https://myschema.com';

    const event: Cloudevent = CloudEventFactory.createV02(aggregate, eventType, source, playerData, {
      schemaurl,
    });
    const payload = event.format() as Spec02Payload;
    const expectedType = `${process.env.REVERSE_DNS}.${aggregate}.${eventType}`;

    expect(event).toBeInstanceOf(Cloudevent);
    expect(event.getSpecversion()).toBe('0.2');
    expect(event.getType()).toBe(expectedType);
    expect(event.getSource()).toBe(source);
    expect(event.getData()).toBe(playerData);
    expect(event.getSchemaurl()).toBe(schemaurl);

    expect(payload.specversion).toBe('0.2');
    expect(payload.source).toBe(source);
    expect(payload.type).toBe(expectedType);
    expect(payload.data).toBe(playerData);
  });
});
