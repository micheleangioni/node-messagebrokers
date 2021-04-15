export default class AbstractBroker {
  public initialised: boolean = false;

  public async init(_clientOptions?: Record<string, any>) {
    this.initialised = true;

    return Promise.resolve(true);
  }
}
