export default class AbstractBroker {
  public initialised: boolean = false;

  public async init(_clientOptions?: any, _producerOptions?: any) {
    this.initialised = true;

    return Promise.resolve(true);
  }
}
