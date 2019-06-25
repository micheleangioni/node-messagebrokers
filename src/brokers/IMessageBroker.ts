import Cloudevent from 'cloudevents-sdk';
import ILoggerInterface from '../logger/ILoggerInterface';
import { MessageOptions } from './declarations';

export default interface IMessageBroker {
  init(): Promise<boolean>;

  setLogger(logger: ILoggerInterface): void;

  sendMessage(aggregate: string, cloudevent: Cloudevent, options?: MessageOptions): Promise<any>;

  sendMessageList(aggregate: string, cloudevents: Cloudevent[], options?: MessageOptions): Promise<any>;
}
