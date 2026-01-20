import { Schema as S } from 'effect';

export class TodoNotFoundError extends S.TaggedError<TodoNotFoundError>()(
  'TodoNotFoundError',
  {
    id: S.Number,
  },
) {}

export class ProjectNotFoundError extends S.TaggedError<ProjectNotFoundError>()(
  'ProjectNotFoundError',
  {
    id: S.Number,
  },
) {}
