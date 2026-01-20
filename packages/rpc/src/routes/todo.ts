import { Rpc, RpcGroup } from '@effect/rpc';
import { Schema as S } from 'effect';
import { Todo } from '../common';
import { InternalError } from '../errors/base';
import { TodoNotFoundError } from '../errors/domain';

const TodoCreate = Rpc.make('TodoCreate', {
  payload: {
    projectId: S.Number,
    title: S.String.pipe(
      S.minLength(1, { message: () => 'Title is required' }),
    ),
    description: S.optional(S.String),
  },
  success: S.Undefined,
  error: InternalError,
});

const TodoGetAll = Rpc.make('TodoGetAll', {
  success: S.Array(Todo),
  error: InternalError,
});

const TodoGetByProjectId = Rpc.make('TodoGetByProjectId', {
  payload: {
    projectId: S.Number,
  },
  success: S.Array(Todo),
  error: InternalError,
});

const TodoGetById = Rpc.make('TodoGetById', {
  payload: {
    id: S.Number,
  },
  success: Todo,
  error: S.Union(TodoNotFoundError, InternalError),
});

const TodoUpdate = Rpc.make('TodoUpdate', {
  payload: {
    id: S.Number,
    data: S.Struct({
      title: S.optional(S.String.pipe(S.minLength(1))),
      description: S.optional(S.String),
      completed: S.optional(S.Boolean),
    }),
  },
  success: S.Undefined,
  error: S.Union(TodoNotFoundError, InternalError),
});

const TodoDelete = Rpc.make('TodoDelete', {
  payload: {
    id: S.Number,
  },
  success: S.Undefined,
  error: S.Union(TodoNotFoundError, InternalError),
});

const TodoToggle = Rpc.make('TodoToggle', {
  payload: {
    id: S.Number,
  },
  success: S.Undefined,
  error: S.Union(TodoNotFoundError, InternalError),
});

const TodoGetByProjectIdPaginated = Rpc.make('TodoGetByProjectIdPaginated', {
  payload: {
    projectId: S.Number,
    cursor: S.optional(S.Number),
    limit: S.optional(S.Number.pipe(S.int(), S.positive())),
  },
  success: S.Struct({
    todos: S.Array(Todo),
    nextCursor: S.NullOr(S.Number),
  }),
  error: InternalError,
});

export class TodoGroup extends RpcGroup.make(
  TodoCreate,
  TodoGetAll,
  TodoGetByProjectId,
  TodoGetByProjectIdPaginated,
  TodoGetById,
  TodoUpdate,
  TodoDelete,
  TodoToggle,
) {}
