import { Config } from 'effect';

export enum ConfigEnum {
  LOG_LEVEL = 'LOG_LEVEL',
  NODE_ENV = 'NODE_ENV',
  DB_PATH = 'DB_PATH',
}

const logLevel = Config.logLevel(ConfigEnum.LOG_LEVEL);

const nodeEnv = Config.string(ConfigEnum.NODE_ENV).pipe(
  Config.withDefault('development'),
);

const dbPath = Config.string(ConfigEnum.DB_PATH).pipe(
  Config.withDefault('./src/db/todo.db'),
);

export const AppConfig = Config.all({
  logLevel,
  nodeEnv,
  dbPath,
});
