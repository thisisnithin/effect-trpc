import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { expectNotFound } from './expect-error.js';
import { runTest, startTestServer } from './test-server.js';

describe('Project App E2E', () => {
  describe('Projects', () => {
    it(
      'creates a project',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const result = yield* Effect.promise(() =>
          client.project.create.mutate({
            name: 'Test Project',
            description: 'This is a test project',
          }),
        );

        expect(result.name).toBe('Test Project');
        expect(result.description).toBe('This is a test project');
        expect(result.id).toBeTypeOf('number');
      }),
    );

    it(
      'creates a project with todos in a transaction',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const result = yield* Effect.promise(() =>
          client.project.createWithTodos.mutate({
            name: 'Launch Website',
            description: 'Website launch project',
            todos: [
              { title: 'Design mockups', description: 'Create UI/UX designs' },
              {
                title: 'Implement frontend',
                description: 'Build React components',
              },
              { title: 'Deploy to production' },
            ],
          }),
        );

        expect(result.project.name).toBe('Launch Website');
        expect(result.todos.length).toBe(3);
        expect(result.todos[0].title).toBe('Design mockups');
        expect(result.todos[1].title).toBe('Implement frontend');
        expect(result.todos[2].title).toBe('Deploy to production');
        expect(result.todos[0].projectId).toBe(result.project.id);
        expect(result.todos[1].projectId).toBe(result.project.id);
        expect(result.todos[2].projectId).toBe(result.project.id);
      }),
    );

    it(
      'gets all projects',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Project 1' }),
        );
        yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Project 2' }),
        );

        const result = yield* Effect.promise(() =>
          client.project.getAll.query(),
        );

        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result.some((p) => p.name === 'Project 1')).toBe(true);
        expect(result.some((p) => p.name === 'Project 2')).toBe(true);
      }),
    );

    it(
      'gets a project by id',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const created = yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Find Me' }),
        );

        const result = yield* Effect.promise(() =>
          client.project.getById.query(created.id),
        );

        expect(result.id).toBe(created.id);
        expect(result.name).toBe('Find Me');
      }),
    );

    it(
      'gets a project with todos',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const created = yield* Effect.promise(() =>
          client.project.createWithTodos.mutate({
            name: 'Project with Todos',
            todos: [{ title: 'Todo 1' }, { title: 'Todo 2' }],
          }),
        );

        const result = yield* Effect.promise(() =>
          client.project.getWithTodos.query(created.project.id),
        );

        expect(result.project.name).toBe('Project with Todos');
        expect(result.todos.length).toBe(2);
        expect(result.todos[0].title).toBe('Todo 1');
        expect(result.todos[1].title).toBe('Todo 2');
      }),
    );

    it(
      'updates a project',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const created = yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Original Name' }),
        );

        const updated = yield* Effect.promise(() =>
          client.project.update.mutate({
            id: created.id,
            data: { name: 'Updated Name', description: 'New description' },
          }),
        );

        expect(updated.id).toBe(created.id);
        expect(updated.name).toBe('Updated Name');
        expect(updated.description).toBe('New description');
      }),
    );

    it(
      'deletes a project',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const created = yield* Effect.promise(() =>
          client.project.createWithTodos.mutate({
            name: 'Delete Me',
            todos: [{ title: 'Associated todo' }],
          }),
        );

        const result = yield* Effect.promise(() =>
          client.project.delete.mutate(created.project.id),
        );

        expect(result.success).toBe(true);
        expect(result.id).toBe(created.project.id);

        const getProjectResult = yield* Effect.either(
          Effect.tryPromise(() =>
            client.project.getById.query(created.project.id),
          ),
        );
        expectNotFound(getProjectResult);
      }),
    );
  });

  describe('Todos', () => {
    it(
      'creates a todo',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const project = yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Test Project' }),
        );

        const result = yield* Effect.promise(() =>
          client.todo.create.mutate({
            projectId: project.id,
            title: 'Test Todo',
            description: 'This is a test todo',
          }),
        );

        expect(result.title).toBe('Test Todo');
        expect(result.description).toBe('This is a test todo');
        expect(result.completed).toBe(false);
        expect(result.projectId).toBe(project.id);
        expect(result.id).toBeTypeOf('number');
      }),
    );

    it(
      'gets all todos',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const project = yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Test Project' }),
        );

        yield* Effect.promise(() =>
          client.todo.create.mutate({
            projectId: project.id,
            title: 'Todo 1',
          }),
        );
        yield* Effect.promise(() =>
          client.todo.create.mutate({
            projectId: project.id,
            title: 'Todo 2',
          }),
        );

        const result = yield* Effect.promise(() => client.todo.getAll.query());

        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result.some((t) => t.title === 'Todo 1')).toBe(true);
        expect(result.some((t) => t.title === 'Todo 2')).toBe(true);
      }),
    );

    it(
      'gets todos by project',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const project1 = yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Project 1' }),
        );
        const project2 = yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Project 2' }),
        );

        yield* Effect.promise(() =>
          client.todo.create.mutate({
            projectId: project1.id,
            title: 'Project 1 Todo',
          }),
        );
        yield* Effect.promise(() =>
          client.todo.create.mutate({
            projectId: project2.id,
            title: 'Project 2 Todo',
          }),
        );

        const result = yield* Effect.promise(() =>
          client.todo.getByProjectId.query(project1.id),
        );

        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result.every((t) => t.projectId === project1.id)).toBe(true);
        expect(result.some((t) => t.title === 'Project 1 Todo')).toBe(true);
      }),
    );

    it(
      'gets a todo by id',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const project = yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Test Project' }),
        );

        const created = yield* Effect.promise(() =>
          client.todo.create.mutate({
            projectId: project.id,
            title: 'Find Me',
          }),
        );

        const result = yield* Effect.promise(() =>
          client.todo.getById.query(created.id),
        );

        expect(result.id).toBe(created.id);
        expect(result.title).toBe('Find Me');
      }),
    );

    it(
      'updates a todo',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const project = yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Test Project' }),
        );

        const created = yield* Effect.promise(() =>
          client.todo.create.mutate({
            projectId: project.id,
            title: 'Original Title',
          }),
        );

        const updated = yield* Effect.promise(() =>
          client.todo.update.mutate({
            id: created.id,
            data: { title: 'Updated Title', completed: true },
          }),
        );

        expect(updated.id).toBe(created.id);
        expect(updated.title).toBe('Updated Title');
        expect(updated.completed).toBe(true);
      }),
    );

    it(
      'toggles todo completion',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const project = yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Test Project' }),
        );

        const created = yield* Effect.promise(() =>
          client.todo.create.mutate({
            projectId: project.id,
            title: 'Toggle Me',
          }),
        );

        expect(created.completed).toBe(false);

        const toggled = yield* Effect.promise(() =>
          client.todo.toggle.mutate(created.id),
        );

        expect(toggled.completed).toBe(true);

        const toggledBack = yield* Effect.promise(() =>
          client.todo.toggle.mutate(created.id),
        );

        expect(toggledBack.completed).toBe(false);
      }),
    );

    it(
      'deletes a todo',
      runTest(function* () {
        const { client } = yield* startTestServer();

        const project = yield* Effect.promise(() =>
          client.project.create.mutate({ name: 'Test Project' }),
        );

        const created = yield* Effect.promise(() =>
          client.todo.create.mutate({
            projectId: project.id,
            title: 'Delete Me',
          }),
        );

        const result = yield* Effect.promise(() =>
          client.todo.delete.mutate(created.id),
        );

        expect(result.success).toBe(true);
        expect(result.id).toBe(created.id);

        const getResult = yield* Effect.either(
          Effect.tryPromise(() => client.todo.getById.query(created.id)),
        );

        expectNotFound(getResult);
      }),
    );
  });

  it(
    'health check returns OK',
    runTest(function* () {
      const { port } = yield* startTestServer();

      const response = yield* Effect.promise(() =>
        fetch(`http://localhost:${port}/health`),
      );
      const text = yield* Effect.promise(() => response.text());

      expect(response.status).toBe(200);
      expect(text).toBe('OK');
    }),
  );
});
