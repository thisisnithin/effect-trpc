import { Schema as S } from 'effect';

export const Project = S.Struct({
  id: S.Number,
  name: S.String,
  description: S.NullOr(S.String),
  createdAt: S.Date,
  updatedAt: S.Date,
});

export const TodoStatus = S.Literal('todo', 'in-progress', 'done');
export type TodoStatus = S.Schema.Type<typeof TodoStatus>;

export const Todo = S.Struct({
  id: S.Number,
  projectId: S.Number,
  title: S.String,
  description: S.NullOr(S.String),
  status: TodoStatus,
  order: S.Number,
  createdAt: S.Date,
  updatedAt: S.Date,
});
