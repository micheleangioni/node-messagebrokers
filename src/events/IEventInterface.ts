export default interface IEventInterface {
  id: string;
  type: string;
  data: any;
  time: string | Date;
  toJSON(): { [s: string]: any };
}
