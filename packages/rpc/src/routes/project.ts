import { Rpc, RpcGroup } from '@effect/rpc';
import { Schema as S } from 'effect';
import { Project } from '../common';
import { InternalError } from '../errors/base';
import { ProjectNotFoundError } from '../errors/domain';

const ProjectCreate = Rpc.make('ProjectCreate', {
  payload: {
    name: S.String.pipe(S.minLength(1, { message: () => 'Name is required' })),
    description: S.optional(S.String),
  },
  success: S.Undefined,
  error: InternalError,
});

const ProjectGetAll = Rpc.make('ProjectGetAll', {
  success: S.Array(Project),
  error: InternalError,
});

const ProjectGetById = Rpc.make('ProjectGetById', {
  payload: {
    id: S.Number,
  },
  success: Project,
  error: S.Union(ProjectNotFoundError, InternalError),
});

const ProjectDelete = Rpc.make('ProjectDelete', {
  payload: {
    id: S.Number,
  },
  success: S.Undefined,
  error: S.Union(ProjectNotFoundError, InternalError),
});

export class ProjectGroup extends RpcGroup.make(
  ProjectCreate,
  ProjectGetAll,
  ProjectGetById,
  ProjectDelete,
) {}
