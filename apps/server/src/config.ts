import { Config } from 'effect';

export enum ConfigEnum {
  LOG_LEVEL = 'LOG_LEVEL',
  NODE_ENV = 'NODE_ENV',
  DATABASE_URL = 'DATABASE_URL',
  ELECTRIC_URL = 'ELECTRIC_URL',
}

const logLevel = Config.logLevel(ConfigEnum.LOG_LEVEL);

const nodeEnv = Config.string(ConfigEnum.NODE_ENV).pipe(
  Config.withDefault('development'),
);

const dbUrl = Config.string(ConfigEnum.DATABASE_URL).pipe(
  Config.withDefault('postgresql://postgres:postgres@localhost:5432/todos'),
);

const electricUrl = Config.string(ConfigEnum.ELECTRIC_URL).pipe(
  Config.withDefault('http://localhost:3002'),
);

export const AppConfig = Config.all({
  logLevel,
  nodeEnv,
  dbUrl,
  electricUrl,
});
