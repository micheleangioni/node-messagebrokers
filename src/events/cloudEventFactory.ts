import Cloudevent from 'cloudevents-sdk';
import v03 from 'cloudevents-sdk/v03';
import uuidv4 from 'uuid/v4';

type SpecVersion = '0.2' | '0.3';

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

    const cloudevent: Cloudevent = CloudEventFactory.specVersion === '0.3'
      ? v03.event()
      : new Cloudevent(Cloudevent.specs[CloudEventFactory.specVersion]);

    if (specOptions.contentType) {
      cloudevent.contenttype(specOptions.contentType);
    }

    return cloudevent
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
