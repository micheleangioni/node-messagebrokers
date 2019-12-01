import Cloudevent, { event } from 'cloudevents-sdk/v1';
import uuidv4 from 'uuid/v4';
import { CreateEventV1Options } from './declarations';

export default class CloudEventFactory {
  public static createV1(
    aggregate: string,
    eventType: string,
    source: string,
    data: any,
    options: CreateEventV1Options = {},
  ): Cloudevent {
    const specOptions = CloudEventFactory.mergeOptionsWithDefaults(options);
    const cloudevent: Cloudevent = event();

    if (specOptions.datacontenttype) {
      cloudevent.dataContentType(specOptions.datacontenttype);
    }

    if (specOptions.dataschema) {
      cloudevent.dataschema(specOptions.dataschema);
    }

    if (specOptions.subject) {
      cloudevent.subject(specOptions.subject);
    }

    return cloudevent
      .type(CloudEventFactory.getEventType(aggregate, eventType))
      .source(source)
      .id(uuidv4())
      .time(new Date())
      .data(data);
  }

  private static readonly defaultOptions = {
    datacontenttype: 'application/json',
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
