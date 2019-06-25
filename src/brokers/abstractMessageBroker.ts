import ILoggerInterface from '../logger/ILoggerInterface';

export default class AbstractBroker {
  public initialised: boolean;
  protected logger?: ILoggerInterface;

  constructor() {
    this.initialised = false;
  }

  public async init() {
    this.initialised = true;

    return true;
  }

  public getLogger(): ILoggerInterface|undefined {
    return this.logger;
  }

  public setLogger(logger: ILoggerInterface): void {
    this.logger = logger;
  }
}
