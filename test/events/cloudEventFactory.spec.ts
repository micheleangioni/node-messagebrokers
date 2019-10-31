// @ts-ignore
import Cloudevent, { Spec02Payload } from 'cloudevents-sdk';
import CloudEventFactory from '../../src/events/cloudEventFactory';

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
    CloudEventFactory.changeEventType('0.3');

    const event: Cloudevent = CloudEventFactory.create(aggregate, eventType, source, playerData);
    const payload = event.format() as Spec02Payload;
    const expectedType = `${process.env.REVERSE_DNS}.${aggregate}.${eventType}`;

    expect(event).toBeInstanceOf(Cloudevent);
    expect(event.getSpecversion()).toBe('0.3');
    expect(event.getType()).toBe(expectedType);
    expect(event.getSource()).toBe(source);
    expect(event.getData()).toBe(playerData);

    expect(payload.specversion).toBe('0.3');
    expect(payload.source).toBe(source);
    expect(payload.type).toBe(expectedType);
    expect(payload.data).toBe(playerData);
  });

  it('correctly creates a v0.2 CloudEvent instance', () => {
    CloudEventFactory.changeEventType('0.2');

    const event: Cloudevent = CloudEventFactory.create(aggregate, eventType, source, playerData);
    const payload = event.format() as Spec02Payload;
    const expectedType = `${process.env.REVERSE_DNS}.${aggregate}.${eventType}`;

    expect(event).toBeInstanceOf(Cloudevent);
    expect(event.getSpecversion()).toBe('0.2');
    expect(event.getType()).toBe(expectedType);
    expect(event.getSource()).toBe(source);
    expect(event.getData()).toBe(playerData);

    expect(payload.specversion).toBe('0.2');
    expect(payload.source).toBe(source);
    expect(payload.type).toBe(expectedType);
    expect(payload.data).toBe(playerData);
  });
});
