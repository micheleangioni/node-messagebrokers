// tslint:disable max-classes-per-file
declare module 'cloudevents-sdk' {
  export type Spec01Payload = {
    cloudEventsVersion: '0.1',
    eventID: string,
    eventType?: string,
    source?: string,
    eventTime?: string,
    schemaURL?: string,
    contentType?: string,
    data?: any,
  };

  export type Spec02Payload = {
    specversion: '0.2',
    id: string,
    type?: string,
    source?: string,
    time?: string,
    schemaurl?: string,
    contenttype?: string,
    data?: any,
  };

  export class Spec01 {
    public payload: Spec01Payload;

    public check(): void;

    public type(type: string): Spec01;
    public getType(): string|undefined;

    public getSpecversion(): string;

    public eventTypeVersion(eventTypeVersion: string): Spec01;
    public getEventTypeVersion(): string|undefined;

    public source(source: string): Spec01;
    public getSource(): string|undefined;

    public id(id: string): Spec01;
    public getId(): string|undefined;

    public schemaurl(schemaurl: string): Spec01;
    public getSchemaurl(): string|undefined;

    public contenttype(contenttype: string): Spec01;
    public getContenttype(): string|undefined;

    public data(data: any): Spec01;
    public getData(): any;

    public time(time: Date): Spec01;
    public getTime(): string|undefined;

    public addExtension(key: string, value: any): Spec01;
  }

  export class Spec02 {
    public payload: Spec02Payload;

    public check(): void;

    public type(type: string): Spec02;
    public getType(): string|undefined;

    public getSpecversion(): string;

    public eventTypeVersion(eventTypeVersion: string): Spec02;
    public getEventTypeVersion(): string|undefined;

    public source(source: string): Spec02;
    public getSource(): string|undefined;

    public id(id: string): Spec02;
    public getId(): string|undefined;

    public time(time: Date): Spec02;
    public getTime(): string|undefined;

    public schemaurl(schemaurl: string): Spec02;
    public getSchemaurl(): string|undefined;

    public contenttype(contenttype: string): Spec02;
    public getContenttype(): string|undefined;

    public data(data: any): Spec02;
    public getData(): any;

    public addExtension(key: string, value: any): Spec02;
  }

  export type Extensions = {
    [key: string]: any,
  };

  export class JSONFormatter01 {
    public format<T>(payload: T): T;
    public toString<T>(payload: T): string;
  }

  export default class Cloudevent {
    public static specs: {
      '0.1': Spec01,
      '0.2': Spec02,
    };

    public static formats: {
      'json': JSONFormatter01,
      'json0.1': JSONFormatter01,
    };

    public static bindings: {
      'http-structured': any,
      'http-structured0.1': any,
      'http-structured0.2': any,
      'http-binary0.1': any,
      'http-binary0.2': any,
    };

    public constructor(spec?: Spec01|Spec02, formatter?: JSONFormatter01);

    public format(): Spec01Payload|Spec02Payload;
    public toString(): string;

    public type(type: string): Cloudevent;
    public getType(): string|undefined;

    public getSpecversion(): string;

    public source(type: string): Cloudevent;
    public getSource(): string|undefined;

    public id(id: string|number): Cloudevent;
    public getId(): string|undefined;

    public time(type: Date): Cloudevent;
    public getTime(): string|undefined;

    public schemaurl(schemaurl: string): Cloudevent;
    public getSchemaurl(): string|undefined;

    public contenttype(contenttype: string): Cloudevent;
    public getContenttype(): string|undefined;

    public data(data: any): Cloudevent;
    public getData(): any;

    public addExtension(key: string, value: any): Cloudevent;
    public getExtensions(): Extensions;
  }
}
