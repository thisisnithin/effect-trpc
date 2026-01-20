import { Effect, Either } from 'effect';
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
      'creates a project with todos in a transaction',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreateWithTodos({
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
        });

        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Launch Website');
        expect(project).toBeDefined();

        const result = yield* client.ProjectGetWithTodos({ id: project!.id });

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

        yield* client.ProjectCreate({ name: 'Project 1' });
        yield* client.ProjectCreate({ name: 'Project 2' });

        const result = yield* client.ProjectGetAll();

        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result.some((p) => p.name === 'Project 1')).toBe(true);
        expect(result.some((p) => p.name === 'Project 2')).toBe(true);
      }),
    );

    it(
      'gets a project by id',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Find Me' });

        const projects = yield* client.ProjectGetAll();
        const created = projects.find((p) => p.name === 'Find Me');
        expect(created).toBeDefined();

        const result = yield* client.ProjectGetById({ id: created!.id });

        expect(result.id).toBe(created!.id);
        expect(result.name).toBe('Find Me');
      }),
    );

    it(
      'gets a project with todos',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreateWithTodos({
          name: 'Project with Todos',
          todos: [{ title: 'Todo 1' }, { title: 'Todo 2' }],
        });

        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Project with Todos');
        expect(project).toBeDefined();

        const result = yield* client.ProjectGetWithTodos({ id: project!.id });

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

        yield* client.ProjectCreate({ name: 'Original Name' });

        const projects = yield* client.ProjectGetAll();
        const created = projects.find((p) => p.name === 'Original Name');
        expect(created).toBeDefined();

        yield* client.ProjectUpdate({
          id: created!.id,
          data: { name: 'Updated Name', description: 'New description' },
        });

        const updated = yield* client.ProjectGetById({ id: created!.id });

        expect(updated.id).toBe(created!.id);
        expect(updated.name).toBe('Updated Name');
        expect(updated.description).toBe('New description');
      }),
    );

    it(
      'deletes a project',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreateWithTodos({
          name: 'Delete Me',
          todos: [{ title: 'Associated todo' }],
        });

        const projects = yield* client.ProjectGetAll();
        const created = projects.find((p) => p.name === 'Delete Me');
        expect(created).toBeDefined();

        yield* client.ProjectDelete({ id: created!.id });

        const getProjectResult = yield* Effect.either(
          client.ProjectGetById({ id: created!.id }),
        );
        Either.match(getProjectResult, {
          onLeft: (error) => {
            expect(error._tag).toBe('ProjectNotFoundError');
          },
          onRight: () => {
            throw new Error('Expected ProjectNotFoundError but got success');
          },
        });
      }),
    );
  });

  describe('Todos', () => {
    it(
      'creates a todo',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Test Project' });

        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Test Project');
        expect(project).toBeDefined();

        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Test Todo',
          description: 'This is a test todo',
        });

        const todos = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });
        const result = todos.find((t) => t.title === 'Test Todo');
        expect(result).toBeDefined();

        expect(result!.title).toBe('Test Todo');
        expect(result!.description).toBe('This is a test todo');
        expect(result!.completed).toBe(false);
        expect(result!.projectId).toBe(project!.id);
        expect(result!.id).toBeTypeOf('number');
      }),
    );

    it(
      'gets all todos',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Test Project' });

        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Test Project');
        expect(project).toBeDefined();

        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Todo 1',
        });
        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Todo 2',
        });

        const result = yield* client.TodoGetAll();

        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result.some((t) => t.title === 'Todo 1')).toBe(true);
        expect(result.some((t) => t.title === 'Todo 2')).toBe(true);
      }),
    );

    it(
      'gets todos by project',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Project 1' });
        yield* client.ProjectCreate({ name: 'Project 2' });

        const allProjects = yield* client.ProjectGetAll();
        const project1 = allProjects.find((p) => p.name === 'Project 1');
        const project2 = allProjects.find((p) => p.name === 'Project 2');
        expect(project1).toBeDefined();
        expect(project2).toBeDefined();

        yield* client.TodoCreate({
          projectId: project1!.id,
          title: 'Project 1 Todo',
        });
        yield* client.TodoCreate({
          projectId: project2!.id,
          title: 'Project 2 Todo',
        });

        const result = yield* client.TodoGetByProjectId({
          projectId: project1!.id,
        });

        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result.every((t) => t.projectId === project1!.id)).toBe(true);
        expect(result.some((t) => t.title === 'Project 1 Todo')).toBe(true);
      }),
    );

    it(
      'gets a todo by id',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Test Project' });

        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Test Project');
        expect(project).toBeDefined();

        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Find Me',
        });

        const todos = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });
        const created = todos.find((t) => t.title === 'Find Me');
        expect(created).toBeDefined();

        const result = yield* client.TodoGetById({ id: created!.id });

        expect(result.id).toBe(created!.id);
        expect(result.title).toBe('Find Me');
      }),
    );

    it(
      'updates a todo',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Test Project' });

        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Test Project');
        expect(project).toBeDefined();

        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Original Title',
        });

        const allTodos = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });
        const created = allTodos.find((t) => t.title === 'Original Title');
        expect(created).toBeDefined();

        yield* client.TodoUpdate({
          id: created!.id,
          data: { title: 'Updated Title', completed: true },
        });

        const updated = yield* client.TodoGetById({ id: created!.id });

        expect(updated.id).toBe(created!.id);
        expect(updated.title).toBe('Updated Title');
        expect(updated.completed).toBe(true);
      }),
    );

    it(
      'toggles todo completion',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Test Project' });

        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Test Project');
        expect(project).toBeDefined();

        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Toggle Me',
        });

        const allTodos = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });
        const created = allTodos.find((t) => t.title === 'Toggle Me');
        expect(created).toBeDefined();
        expect(created!.completed).toBe(false);

        yield* client.TodoToggle({ id: created!.id });

        const toggled = yield* client.TodoGetById({ id: created!.id });
        expect(toggled.completed).toBe(true);

        yield* client.TodoToggle({ id: created!.id });

        const toggledBack = yield* client.TodoGetById({ id: created!.id });
        expect(toggledBack.completed).toBe(false);
      }),
    );

    it(
      'deletes a todo',
      runTest(function* () {
        const { client } = yield* startTestServer();

        yield* client.ProjectCreate({ name: 'Test Project' });

        const projects = yield* client.ProjectGetAll();
        const project = projects.find((p) => p.name === 'Test Project');
        expect(project).toBeDefined();

        yield* client.TodoCreate({
          projectId: project!.id,
          title: 'Delete Me',
        });

        const allTodos = yield* client.TodoGetByProjectId({
          projectId: project!.id,
        });
        const created = allTodos.find((t) => t.title === 'Delete Me');
        expect(created).toBeDefined();

        yield* client.TodoDelete({ id: created!.id });

        const getResult = yield* Effect.either(
          client.TodoGetById({ id: created!.id }),
        );

        Either.match(getResult, {
          onLeft: (error) => {
            expect(error._tag).toBe('TodoNotFoundError');
          },
          onRight: () => {
            throw new Error('Expected TodoNotFoundError but got success');
          },
        });
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
