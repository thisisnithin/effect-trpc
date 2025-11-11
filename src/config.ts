import { Config, LogLevel } from 'effect';

export enum ConfigEnum {
  LOG_LEVEL = 'LOG_LEVEL',
  NODE_ENV = 'NODE_ENV',
  DB_PATH = 'DB_PATH',
}

const logLevel = Config.string(ConfigEnum.LOG_LEVEL).pipe(
  Config.withDefault('Info'),
  Config.validate({
    message: 'Must be a valid log level',
    validation: (s): s is LogLevel.Literal =>
      [
        'All',
        'Trace',
        'Debug',
        'Info',
        'Warning',
        'Error',
        'Fatal',
        'None',
      ].includes(s),
  }),
  Config.map(LogLevel.fromLiteral),
);

const nodeEnv = Config.string(ConfigEnum.NODE_ENV).pipe(
  Config.withDefault('development'),
);

const dbPath = Config.string(ConfigEnum.DB_PATH).pipe(
  Config.withDefault('./todo.db'),
);

export const AppConfig = Config.all({
  logLevel,
  nodeEnv,
  dbPath,
});
