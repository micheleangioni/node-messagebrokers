import { Spec01Payload, Spec02Payload } from 'cloudevents-sdk';

export default interface IEventInterface<T extends Spec01Payload | Spec02Payload> {
  getId(): string|undefined;
  getType(): string|undefined;
  getData(): any;
  getTime(): string|undefined;
  format(): T;
}
