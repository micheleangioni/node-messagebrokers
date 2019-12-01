import Cloudevent from 'cloudevents-sdk/v1';

export default interface IEventInterface<T extends Cloudevent> {
  getId(): string|undefined;
  getType(): string|undefined;
  getData(): any;
  getTime(): Date;
  format(): T;
}
