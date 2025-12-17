import { describe, expect, it } from 'vitest';
import { runTest, startTestServer } from './test-server';

describe('Project App E2E', () => {
  describe('Projects', () => {
    it(
      'creates a project',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({
          name: 'Test Project',
          description: 'This is a test project',
        });

        const projects = yield* client.ProjectGetAll();
        const result = projects.find((p) => p.name === 'Test Project');

        expect(result).toBeDefined();
        expect(result?.name).toBe('Test Project');
        expect(result?.description).toBe('This is a test project');
        expect(result?.id).toBeTypeOf('number');
      }),
    );

    it(
      'gets a project by id',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({
          name: 'Get Test Project',
        });

        const projects = yield* client.ProjectGetAll();
        const created = projects.find((p) => p.name === 'Get Test Project');
        expect(created).toBeDefined();

        const result = yield* client.ProjectGetById({ id: created!.id });
        expect(result.name).toBe('Get Test Project');
      }),
    );

    it(
      'deletes a project',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({
          name: 'Delete Test Project',
        });

        const projects = yield* client.ProjectGetAll();
        const created = projects.find((p) => p.name === 'Delete Test Project');
        expect(created).toBeDefined();

        yield* client.ProjectDelete({ id: created!.id });

        const afterDelete = yield* client.ProjectGetAll();
        const deleted = afterDelete.find((p) => p.id === created!.id);
        expect(deleted).toBeUndefined();
      }),
    );
  });

  describe('Todos', () => {
    it(
      'creates a todo',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Todo Test Project' });
        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Todo Test Project');
        expect(project).toBeDefined();

        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Test Todo',
          description: 'Test Description',
          status: 'todo',
        });

        const todos = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });
        const todo = todos.find((t) => t.title === 'Test Todo');

        expect(todo).toBeDefined();
        expect(todo?.title).toBe('Test Todo');
        expect(todo?.description).toBe('Test Description');
        expect(todo?.status).toBe('todo');
      }),
    );

    it(
      'gets all todos for a project',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Multi Todo Project' });
        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Multi Todo Project');
        expect(project).toBeDefined();

        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Todo 1',
          status: 'todo',
        });
        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Todo 2',
          status: 'in-progress',
        });

        const todos = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });

        expect(todos.length).toBe(2);
      }),
    );

    it(
      'updates a todo',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Update Todo Project' });
        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Update Todo Project');
        expect(project).toBeDefined();

        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Original Title',
          status: 'todo',
        });

        const todos = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });
        const todo = todos[0];

        yield* client.TodoUpdate({
          id: todo.id,
          data: { title: 'Updated Title', status: 'in-progress' },
        });

        const updatedTodos = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });
        const updated = updatedTodos.find((t) => t.id === todo.id);

        expect(updated?.title).toBe('Updated Title');
        expect(updated?.status).toBe('in-progress');
      }),
    );

    it(
      'deletes a todo',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Delete Todo Project' });
        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Delete Todo Project');
        expect(project).toBeDefined();

        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'To Delete',
          status: 'todo',
        });

        const todos = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });
        const todo = todos[0];

        yield* client.TodoDelete({ id: todo.id });

        const afterDelete = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });

        expect(afterDelete.length).toBe(0);
      }),
    );
  });
});
