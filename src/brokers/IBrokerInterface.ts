import {Spec02Payload, Spec03Payload} from 'cloudevents-sdk';
import IEventInterface from '../events/IEventInterface';

export default interface IBrokerInterface {
  init(clientOptions?: any, producerOptions?: any): Promise<true>;
  addConsumer(
    aggregate: string|string[],
    consumerConfig: any,
  ): Promise<any>;
  sendMessage(
    aggregate: string,
    cloudevents: IEventInterface<Spec02Payload | Spec03Payload>[],
    { partitionKey }: any,
  ): Promise<any>;
}
