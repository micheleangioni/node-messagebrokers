import Cloudevent from 'cloudevents-sdk';
import v03, { CloudeventV03 } from 'cloudevents-sdk/v03';
import uuidv4 from 'uuid/v4';
import { CreateEventOptions } from './declarations';

type SpecVersion = '0.2' | '0.3';

export default class CloudEventFactory {
  public static create(
    aggregate: string,
    eventType: string,
    source: string,
    data: any,
    options: CreateEventOptions = {},
  ): Cloudevent | CloudeventV03 {
    const type = process.env.REVERSE_DNS
      ? `${process.env.REVERSE_DNS}.${aggregate}.${eventType}`
      : `${aggregate}.${eventType}`;

    const specOptions: CreateEventOptions = { ...CloudEventFactory.defaultOptions, ...options };

    const cloudevent = CloudEventFactory.specVersion === '0.3'
      ? v03.event()
      : new Cloudevent(Cloudevent.specs[CloudEventFactory.specVersion]);

    // v0.3 options

    if (CloudEventFactory.isCloudEventV03Instance(cloudevent)) {
      if (specOptions.datacontentencoding) {
        cloudevent.dataContentEncoding(specOptions.datacontentencoding);
      }

      if (specOptions.datacontenttype) {
        cloudevent.dataContentType(specOptions.datacontenttype);
      }

      if (specOptions.subject) {
        cloudevent.subject(specOptions.subject);
      }
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

  public static isCloudEventV02Instance(cloudevent: any): cloudevent is Cloudevent {
    return typeof cloudevent.getSpecversion === 'function' && cloudevent.getSpecversion() === '0.2';
  }

  public static isCloudEventV03Instance(cloudevent: any): cloudevent is CloudeventV03 {
    return typeof cloudevent.getSpecversion === 'function' && cloudevent.getSpecversion() === '0.3';
  }

  private static specVersion: SpecVersion = '0.3';

  private static readonly defaultOptions = {
    contentType: 'application/json',
  };
}
