import Cloudevent from 'cloudevents-sdk';
import uuidv4 from 'uuid/v4';

type SpecVersion = '0.1' | '0.2';

export default class CloudEventFactory {
  public static create(
    aggregate: string,
    eventType: string,
    source: string,
    data: any,
  ): Cloudevent {
    return new Cloudevent(Cloudevent.specs[CloudEventFactory.specVersion])
      .type(`${process.env.REVERSE_DNS || ''}.${aggregate}.${eventType}`)
      .source(source)
      .id(uuidv4())
      .time(new Date())
      .data(data);
  }

  public static changeEventType(specVersion: SpecVersion) {
    CloudEventFactory.specVersion = specVersion;
  }

  private static specVersion: SpecVersion = '0.2';
}
