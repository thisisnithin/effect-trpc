import { Rpc, RpcGroup } from '@effect/rpc';
import { Schema as S } from 'effect';
import { Todo, TodoStatus } from '../common';
import { InternalError } from '../errors/base';
import { TodoNotFoundError } from '../errors/domain';

const TodoCreate = Rpc.make('TodoCreate', {
  payload: {
    projectId: S.Number,
    title: S.String.pipe(
      S.minLength(1, { message: () => 'Title is required' }),
    ),
    description: S.optional(S.String),
    status: TodoStatus,
  },
  success: S.Undefined,
  error: InternalError,
});

const TodoGetByProjectId = Rpc.make('TodoGetByProjectId', {
  payload: {
    projectId: S.Number,
  },
  success: S.Array(Todo),
  error: InternalError,
});

const TodoGetAll = Rpc.make('TodoGetAll', {
  payload: S.Void,
  success: S.Array(Todo),
  error: InternalError,
});

const TodoUpdate = Rpc.make('TodoUpdate', {
  payload: {
    id: S.Number,
    data: S.Struct({
      title: S.optional(S.String.pipe(S.minLength(1))),
      description: S.optional(S.String),
      status: S.optional(TodoStatus),
      order: S.optional(S.Number),
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

export class TodoGroup extends RpcGroup.make(
  TodoCreate,
  TodoGetByProjectId,
  TodoGetAll,
  TodoUpdate,
  TodoDelete,
) {}
