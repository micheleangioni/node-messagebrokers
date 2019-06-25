export default interface ILoggerInterface {
  error(message: any): any
  warning(message: any): any
  info(message: any): any
  debug(message: any): any
}
