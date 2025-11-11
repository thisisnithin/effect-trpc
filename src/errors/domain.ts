import { NotFoundError } from './base.js';

export class TodoNotFoundError extends NotFoundError {
  constructor(id: number) {
    super({ message: `Todo with id ${id} not found` });
  }
}

export class ProjectNotFoundError extends NotFoundError {
  constructor(id: number) {
    super({ message: `Project with id ${id} not found` });
  }
}
