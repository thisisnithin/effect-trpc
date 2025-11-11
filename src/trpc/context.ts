import { Runtime } from 'effect';

export const createContext = (runtime: Runtime.Runtime<any>) => {
  return { runtime };
};
