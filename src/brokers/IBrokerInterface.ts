import IEventInterface from '../events/IEventInterface';

export default interface IBrokerInterface {
  init(clientOptions?: any, producerOptions?: any): Promise<true>;
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
