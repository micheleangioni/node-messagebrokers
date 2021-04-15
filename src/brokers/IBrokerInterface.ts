import IEventInterface from '../events/IEventInterface';
import {ClientConfiguration} from './declarations';

export default interface IBrokerInterface {
  init(clientConfiguration?: ClientConfiguration): Promise<true>;
  addConsumer(
    aggregate: string|string[],
    consumerConfig: any,
  ): Promise<any>;
  sendMessage(
    aggregate: string,
    cloudevents: IEventInterface[],
    { partitionKey }?: any,
  ): Promise<any>;
}
