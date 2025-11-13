import { Schema as S } from 'effect';

export const Project = S.Struct({
  id: S.Number,
  name: S.String,
  description: S.NullOr(S.String),
  createdAt: S.Date,
  updatedAt: S.Date,
});

export const Todo = S.Struct({
  id: S.Number,
  projectId: S.Number,
  title: S.String,
  description: S.NullOr(S.String),
  completed: S.Boolean,
  createdAt: S.Date,
  updatedAt: S.Date,
});
