export default interface ILoggerInterface {
  error(message: any): void;
  warning(message: any): void;
  info(message: any): void;
  debug(message: any): void;
}
