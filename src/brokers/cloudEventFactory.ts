// @ts-ignore
import Cloudevent from 'cloudevents-sdk';
import uuidv4 from 'uuid/v4';

type SpecVersion = '0.1' | '0.2' | '0.3';

type Options = {
  contentType?: string,
};

export default class CloudEventFactory {
  public static create(
    aggregate: string,
    eventType: string,
    source: string,
    data: any,
    options: Options = {},
  ): Cloudevent {
    const type = process.env.REVERSE_DNS
      ? `${process.env.REVERSE_DNS}.${aggregate}.${eventType}`
      : `${aggregate}.${eventType}`;

    const specOptions: Options = { ...CloudEventFactory.defaultOptions, ...options };

    return new Cloudevent(Cloudevent.specs[CloudEventFactory.specVersion])
      .contenttype(specOptions.contentType)
      .type(type)
      .source(source)
      .id(uuidv4())
      .time(new Date())
      .data(data);
  }

  public static changeEventType(specVersion: SpecVersion) {
    CloudEventFactory.specVersion = specVersion;
  }

  private static specVersion: SpecVersion = '0.3';

  private static readonly defaultOptions = {
    contentType: 'application/json',
  };
}
