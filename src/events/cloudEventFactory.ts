import {CloudEvent, Version} from 'cloudevents';
import {v4 as uuidv4} from 'uuid';
import { CreateEventV1Options } from './declarations';

export default class CloudEventFactory {
  public static createV1(
    aggregate: string,
    eventType: string,
    source: string,
    data: any,
    options: CreateEventV1Options = {},
  ): CloudEvent {
    const type = CloudEventFactory.getEventType(aggregate, eventType);

    const specOptions = CloudEventFactory.mergeOptionsWithDefaults(options);

    return new CloudEvent({
      data,
      id: (uuidv4 as () => string)(),
      source,
      specversion: Version.V1,
      time: new Date().toISOString(),
      type,
      ...(specOptions.datacontenttype && { datacontenttype: specOptions.datacontenttype }),
      ...(specOptions.dataschema && { dataschema: specOptions.dataschema }),
      ...(specOptions.subject && { subject: specOptions.subject }),
    });
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
