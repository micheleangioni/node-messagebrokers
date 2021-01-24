import { MessageErrorData } from './declarations';

export class MessageError extends Error {
  public data?: Record<string, unknown>;
  public err: any;
  public message: string;
  public type?: string;

  constructor({ data, err, message, type }: MessageErrorData) {
    super(message);

    this.data = data;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.err = err;
    this.message = message;
    this.name = this.constructor.name;
    this.type = type;
  }
}
