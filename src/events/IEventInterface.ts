import {Spec02Payload, Spec03Payload} from 'cloudevents-sdk';

export default interface IEventInterface<T extends Spec02Payload | Spec03Payload> {
  getId(): string|undefined;
  getType(): string|undefined;
  getData(): any;
  getTime(): string|undefined;
  format(): T;
}
