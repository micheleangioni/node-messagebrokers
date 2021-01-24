export default interface IEventInterface {
  id: string;
  type: string;
  data: any;
  time?: string;
  toJSON(): { [s: string]: any };
}
