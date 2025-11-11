import { Effect, Layer, Logger } from 'effect';
import { AppConfig } from './config.js';

export const LoggerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const { logLevel, nodeEnv } = yield* AppConfig;
    const isProduction = nodeEnv === 'production';
    const loggerImpl = isProduction ? Logger.json : Logger.pretty;
    return Layer.merge(loggerImpl, Logger.minimumLogLevel(logLevel));
  }),
);
