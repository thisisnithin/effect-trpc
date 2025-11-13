import { FetchHttpClient } from '@effect/platform';
import { Rpc, RpcSerialization } from '@effect/rpc';
import * as RpcClient from '@effect/rpc/RpcClient';
import { AppRouter } from '@repo/rpc';
import type {
  InfiniteData,
  UndefinedInitialDataInfiniteOptions,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  Cause,
  Context,
  Effect,
  Exit,
  identity,
  Layer,
  ManagedRuntime,
} from 'effect';

const ProtocolLive = RpcClient.layerProtocolHttp({
  url: 'http://localhost:3000/rpc',
}).pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(RpcSerialization.layerJson),
);

class AppRpcClient extends Effect.Service<AppRpcClient>()('AppRpcClient', {
  scoped: Effect.all({
    client: RpcClient.make(AppRouter, { flatten: true }),
  }),
  dependencies: [ProtocolLive],
}) {}

const rpcRuntime = ManagedRuntime.make(AppRpcClient.Default);

type UseQueryOpts<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError>,
  'queryKey' | 'queryFn'
>;

type UseInfiniteQueryOpts<
  TData = unknown,
  TError = Error,
  TPageParam = unknown,
> = Omit<
  UndefinedInitialDataInfiniteOptions<
    TData,
    TError,
    InfiniteData<TData, TPageParam>,
    any,
    TPageParam
  >,
  'queryKey' | 'queryFn'
>;

type UseMutationOpts<
  TData = unknown,
  TError = Error,
  TVariables = unknown,
> = Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>;

type RpcClientService = { readonly client: RpcClient.RpcClient.Flat<any> };

type ExtractRpcs<Service extends RpcClientService> = Service extends {
  readonly client: RpcClient.RpcClient.Flat<infer Rpcs>;
}
  ? Rpcs
  : never;

const executeRpc = <ServiceId, Service extends RpcClientService, ErrorChannel>(
  runtime: ManagedRuntime.ManagedRuntime<ServiceId, ErrorChannel>,
  clientTag: Context.Tag<ServiceId, Service>,
  tag: string,
  payload: any,
  signal?: AbortSignal,
): Promise<any> =>
  runtime
    .runPromiseExit(
      Effect.flatMap(clientTag, ({ client }) => client(tag, payload)),
      { signal },
    )
    .then(
      Exit.match({
        onFailure: (cause) => Promise.reject(Cause.squash(cause)),
        onSuccess: identity,
      }),
    );

type RpcMethod<
  ServiceId,
  Service extends RpcClientService,
  Rpcs extends ExtractRpcs<Service>,
  RpcTag extends Rpcs['_tag'],
  ErrorChannel = never,
> = {
  queryOptions: <
    CurrentRpc extends Rpc.ExtractTag<Rpcs, RpcTag>,
    SuccessType extends Rpc.Success<CurrentRpc>,
    ErrorType extends Rpc.Error<CurrentRpc>,
    RpcPayload extends
      Rpc.PayloadConstructor<CurrentRpc> = Rpc.PayloadConstructor<CurrentRpc>,
  >(
    ...args: RpcPayload extends undefined | void
      ? [payload?: RpcPayload, opts?: UseQueryOpts<SuccessType, ErrorType>]
      : [payload: RpcPayload, opts?: UseQueryOpts<SuccessType, ErrorType>]
  ) => UseQueryOptions<SuccessType, ErrorType>;
  infiniteQueryOptions: <
    CurrentRpc extends Rpc.ExtractTag<Rpcs, RpcTag>,
    SuccessType extends Rpc.Success<CurrentRpc>,
    ErrorType extends Rpc.Error<CurrentRpc>,
    RpcPayload extends
      Rpc.PayloadConstructor<CurrentRpc> = Rpc.PayloadConstructor<CurrentRpc>,
    TPageParam = unknown,
  >(
    payloadFn: (pageParam: TPageParam) => RpcPayload,
    opts: UseInfiniteQueryOpts<SuccessType, ErrorType, TPageParam>,
  ) => UndefinedInitialDataInfiniteOptions<
    SuccessType,
    ErrorType,
    InfiniteData<SuccessType, TPageParam>,
    any,
    TPageParam
  >;
  mutationOptions: <
    CurrentRpc extends Rpc.ExtractTag<Rpcs, RpcTag>,
    SuccessType extends Rpc.Success<CurrentRpc>,
    ErrorType extends Rpc.Error<CurrentRpc>,
    RpcPayload = Rpc.PayloadConstructor<CurrentRpc>,
  >(
    opts?: UseMutationOpts<SuccessType, ErrorType, RpcPayload>,
  ) => UseMutationOptions<SuccessType, ErrorType, RpcPayload>;
  queryKey: <
    CurrentRpc extends Rpc.ExtractTag<Rpcs, RpcTag>,
    RpcPayload extends
      Rpc.PayloadConstructor<CurrentRpc> = Rpc.PayloadConstructor<CurrentRpc>,
  >(
    ...args: RpcPayload extends undefined | void
      ? [payload?: RpcPayload]
      : [payload: RpcPayload]
  ) => readonly [RpcTag, string];
  infiniteQueryKey: () => readonly [RpcTag, 'infinite'];
};

type RpcClient<
  ServiceId,
  Service extends RpcClientService,
  Rpcs extends ExtractRpcs<Service> = ExtractRpcs<Service>,
  ErrorChannel = never,
> = {
  [K in Rpcs['_tag']]: RpcMethod<ServiceId, Service, Rpcs, K, ErrorChannel>;
};

const createRpcMethod = <
  ServiceId,
  Service extends RpcClientService,
  Rpcs extends ExtractRpcs<Service>,
  RpcTag extends Rpcs['_tag'],
  ErrorChannel = never,
>(
  clientTag: Context.Tag<ServiceId, Service>,
  runtime: ManagedRuntime.ManagedRuntime<ServiceId, ErrorChannel>,
  tag: RpcTag,
): RpcMethod<ServiceId, Service, Rpcs, RpcTag, ErrorChannel> => ({
  queryOptions: (...args: any[]) => ({
    ...args[1],
    queryKey: [tag, JSON.stringify(args[0])],
    queryFn: ({ signal }: any) =>
      executeRpc(runtime, clientTag, tag, args[0], signal),
  }),
  infiniteQueryOptions: (payloadFn: any, opts: any) => ({
    ...opts,
    queryKey: [tag, 'infinite'],
    queryFn: ({ pageParam, signal }: any) =>
      executeRpc(runtime, clientTag, tag, payloadFn(pageParam), signal),
  }),
  mutationOptions: (opts?: any) => ({
    ...opts,
    mutationFn: (payload: any) => executeRpc(runtime, clientTag, tag, payload),
  }),
  queryKey: (...args: any[]) => [tag, JSON.stringify(args[0])] as const,
  infiniteQueryKey: () => [tag, 'infinite'] as const,
});

const buildRpcClient = <
  ServiceId,
  Service extends RpcClientService,
  Rpcs extends ExtractRpcs<Service> = ExtractRpcs<Service>,
  ErrorChannel = never,
>(
  clientTag: Context.Tag<ServiceId, Service>,
  runtime: ManagedRuntime.ManagedRuntime<ServiceId, ErrorChannel>,
): RpcClient<ServiceId, Service, Rpcs, ErrorChannel> => {
  const methodCache = new Map<string, any>();

  return new Proxy({} as any, {
    get(_target, prop: string) {
      if (typeof prop !== 'string') return undefined;

      if (methodCache.has(prop)) {
        return methodCache.get(prop);
      }

      const method = createRpcMethod(clientTag, runtime, prop as any);
      methodCache.set(prop, method);

      return method;
    },
  });
};

const rpc = buildRpcClient(AppRpcClient, rpcRuntime);

export { rpc };
