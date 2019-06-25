import { Dictionary } from './declarations';

export default interface IEventInterface {
  getId(): string|undefined;
  getType(): string|undefined;
  getData(): any;
  getTime(): string|undefined;
  format(): Dictionary<any>;
}
