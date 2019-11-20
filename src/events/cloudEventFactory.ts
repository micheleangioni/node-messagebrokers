import Cloudevent from 'cloudevents-sdk';
import v03, { CloudeventV03 } from 'cloudevents-sdk/v03';
import uuidv4 from 'uuid/v4';
import { CreateEventV02Options, CreateEventV03Options } from './declarations';

export default class CloudEventFactory {
  public static createV03(
    aggregate: string,
    eventType: string,
    source: string,
    data: any,
    options: CreateEventV03Options = {},
  ): CloudeventV03 {
    const type = process.env.REVERSE_DNS
      ? `${process.env.REVERSE_DNS}.${aggregate}.${eventType}`
      : `${aggregate}.${eventType}`;

    const specOptions = CloudEventFactory.mergeOptionsWithDefaults(options);
    const cloudevent: CloudeventV03 = v03.event();

    if (specOptions.schemaurl) {
      cloudevent.schemaurl(specOptions.schemaurl);
    }

    // v0.3 options

    if (specOptions.datacontentencoding) {
      cloudevent.dataContentEncoding(specOptions.datacontentencoding);
    }

    if (specOptions.datacontenttype) {
      cloudevent.dataContentType(specOptions.datacontenttype);
    }

    if (specOptions.subject) {
      cloudevent.subject(specOptions.subject);
    }

    return cloudevent
      .type(type)
      .source(source)
      .id(uuidv4())
      .time(new Date())
      .data(data);
  }

  public static createV02(
    aggregate: string,
    eventType: string,
    source: string,
    data: any,
    options: CreateEventV02Options = {},
  ): Cloudevent {
    const type = process.env.REVERSE_DNS
      ? `${process.env.REVERSE_DNS}.${aggregate}.${eventType}`
      : `${aggregate}.${eventType}`;

    const specOptions = CloudEventFactory.mergeOptionsWithDefaults(options);
    const cloudevent = new Cloudevent(Cloudevent.specs['0.2']);

    if (specOptions.schemaurl) {
      cloudevent.schemaurl(specOptions.schemaurl);
    }

    return cloudevent
      .type(type)
      .source(source)
      .id(uuidv4())
      .time(new Date())
      .data(data);
  }

  private static readonly defaultOptions = {
    contentType: 'application/json',
  };

  private static mergeOptionsWithDefaults<T>(options: T): T {
    return { ...CloudEventFactory.defaultOptions, ...options };
  }

  private static getEventType(aggregate: string, eventType: string): string {
    return process.env.REVERSE_DNS
      ? `${process.env.REVERSE_DNS}.${aggregate}.${eventType}`
      : `${aggregate}.${eventType}`;
  }
}
