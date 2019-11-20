// tslint:disable max-classes-per-file

declare module 'cloudevents-sdk' {
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

  export type Spec03Payload = {
    specversion: '0.3',
    id: string,
    type?: string,
    source?: string,
    time?: string,
    schemaurl?: string,
    datacontentencoding?: string,
    datacontenttype?: string,
    subject?: string,
    data?: any,
  };

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

  export class Spec03 {
    public payload: Spec03Payload;

    public check(): void;

    public type(type: string): Spec03;
    public getType(): string|undefined;

    public getSpecversion(): string;

    public eventTypeVersion(eventTypeVersion: string): Spec03;
    public getEventTypeVersion(): string|undefined;

    public source(source: string): Spec03;
    public getSource(): string|undefined;

    public id(id: string): Spec03;
    public getId(): string|undefined;

    public time(time: Date): Spec03;
    public getTime(): string|undefined;

    public schemaurl(schemaurl: string): Spec03;
    public getSchemaurl(): string|undefined;

    public dataContentEncoding(encoding: string): Spec03;
    public getDataContentEncoding(): string|undefined;

    public contenttype(contenttype: string): Spec03;
    public getContenttype(): string|undefined;

    public dataContentType(contenttype: string): Spec03;
    public getDataContentType(): string|undefined;

    public subject(contenttype: string): Spec03;
    public getSubject(): string|undefined;

    public data(data: any): Spec03;
    public getData(): any;

    public addExtension(key: string, value: any): Spec03;
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
      '0.2': Spec02,
      '0.3': Spec03,
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

    public constructor(spec?: Spec02, formatter?: JSONFormatter01);

    public format(): Spec02Payload | Spec03Payload;
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

declare module 'cloudevents-sdk/v03' {
  import Cloudevent from 'cloudevents-sdk';

  export class CloudeventV03 extends Cloudevent {
    public dataContentEncoding(encoding: string): CloudeventV03;
    public getDataContentEncoding(): string|undefined;

    public dataContentType(encoding: string): CloudeventV03;
    public getDataContentType(): string|undefined;

    public subject(encoding: string): CloudeventV03;
    public getSubject(): string|undefined;
  }

  export function event(): CloudeventV03;
}
