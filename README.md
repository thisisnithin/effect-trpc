# Effect RPC Monorepo

Effect-native app demonstrating RPC contract sharing, services, DI, transactions, and testing.

## Structure

```
/
├── apps/
│   ├── server/     # Server with handlers, services, database
│   └── web/        # Next.js web client with React Query
└── packages/rpc/   # RPC contract (routes, schemas, errors)
```

## Quick Start

```bash
bun install
bun dev
```

## Architecture

### 1. Configuration

Type-safe config using Effect's `Config` module with validation:

```typescript
const logLevel = Config.string('LOG_LEVEL').pipe(
  Config.withDefault('Info'),
  Config.validate({
    message: 'Must be a valid log level',
    validation: (s): s is LogLevel.Literal => [...].includes(s)
  }),
  Config.map(LogLevel.fromLiteral)
);

export const AppConfig = Config.all({ logLevel, nodeEnv, dbPath });
```

Config is accessed via dependency injection throughout the app.

### 2. Logging

Logger configured based on environment:

```typescript
export const LoggerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const { logLevel, nodeEnv } = yield* AppConfig;
    const isProduction = nodeEnv === 'production';
    const loggerImpl = isProduction ? Logger.json : Logger.pretty;
    return Layer.merge(loggerImpl, Logger.minimumLogLevel(logLevel));
  })
);
```

### 3. RPC Contract (`packages/rpc`)

Define your API contract once using Effect Schema:

```typescript
const TodoCreate = Rpc.make('TodoCreate', {
  payload: {
    projectId: S.Number,
    title: S.String.pipe(S.minLength(1)),
  },
  success: S.Undefined,
  error: InternalError,
});

export const todoGroup = RpcGroup.make(TodoCreate, TodoGetAll, ...);
```

Shared schemas:
```typescript
export const Todo = S.Struct({
  id: S.Number,
  projectId: S.Number,
  title: S.String,
  description: S.NullOr(S.String),
  completed: S.Boolean,
  createdAt: S.Date,
  updatedAt: S.Date,
});
```

### 4. Error Types

Define errors using Effect Schema's `TaggedError`:

```typescript
// Base error
export class InternalError extends S.TaggedError<InternalError>()(
  'InternalError',
  { message: S.String }
) {}

// Domain errors
export class TodoNotFoundError extends S.TaggedError<TodoNotFoundError>()(
  'TodoNotFoundError',
  { id: S.Number }
) {}
```

### 5. Services & Dependency Injection

Services defined with `Effect.Service` — dependencies injected via `yield*`:

```typescript
export class TodoService extends Effect.Service<TodoService>()('TodoService', {
  effect: Effect.gen(function* () {
    const db = yield* Db;  // Dependency injection
    
    const create = (input: { projectId: number; title: string }) =>
      Effect.gen(function* () {
        const result = yield* db.insert(schema.todos).values({
          ...input,
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return result;
      });
    
    const getById = (id: number) =>
      Effect.gen(function* () {
        const result = yield* db
          .select()
          .from(schema.todos)
          .where(eq(schema.todos.id, id));
        
        if (result.length === 0) {
          return yield* Effect.fail(new TodoNotFoundError({ id }));
        }
        return result[0];
      });
    
    return { create, getAll, getById, update, delete, toggle };
  })
}) {}
```

### 6. Handlers (`apps/server`)

Implement RPC handlers using the contract:

```typescript
import { todoGroup } from '@repo/rpc';
import { TodoService } from '../services/TodoService';

export const todoHandlers = todoGroup.toLayer(
  Effect.gen(function* () {
    const todoService = yield* TodoService;
    
    return todoGroup.of({
      TodoCreate: ({ projectId, title, description }) => {
        return withErrorHandling(
          Effect.as(todoService.create({ projectId, title, description }), undefined)
        );
      },
      TodoGetById: ({ id }) => {
        return withErrorHandling(todoService.getById(id));
      },
      // ... other handlers
    });
  })
);
```

Error handling wrapper:
```typescript
export const withErrorHandling = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.catchAll((error: any) =>
      error._tag === 'SqlError'
        ? Effect.gen(function* () {
            yield* Effect.logError('SQL error occurred', { error });
            return yield* Effect.fail(new InternalError({ message: 'An internal error occurred' }));
          })
        : Effect.fail(error)
    )
  );
```

### 7. Layer Composition

Wire up all dependencies:

```typescript
export const AppLive = HttpLive.pipe(
  Layer.provide(ProjectService.Default),
  Layer.provide(TodoService.Default),
  Layer.provide(DbLive),
  Layer.provide(LoggerLive),
);

const program = Effect.gen(function* () {
  yield* Effect.log('Server starting on http://localhost:3000');
  yield* Effect.never;
}).pipe(Effect.provide(AppLive));

BunRuntime.runMain(program);
```

### 8. Transactions

Use `sql.withTransaction` for atomic operations:

```typescript
const createWithTodos = (input) => {
  return sql.withTransaction(
    Effect.gen(function* () {
      const result = yield* db.insert(schema.projects).values({
        name: input.name,
        description: input.description,
        createdAt: now,
        updatedAt: now,
      });
      
      const project = yield* projectService.getById(result.lastInsertRowid);
      
      const todos = yield* Effect.all(
        input.todos.map((todo) =>
          todoService.create({
            projectId: project.id,
            title: todo.title,
            description: todo.description,
          })
        )
      );
      
      return { project, todos };
    })
  );
};
```

Automatic rollback on failure.

### 9. Testing

Tests use `Effect.scoped` for automatic cleanup:

```typescript
export function runTest<A>(f: () => Generator<any, A, any>): () => Promise<A> {
  return async (): Promise<A> => {
    const exit = await Effect.runPromiseExit(
      Effect.scoped(Effect.gen(f as any)) as any
    );
    
    if (exit._tag === 'Success') {
      return exit.value as A;
    }
    
    // Handle errors...
  };
}

it('creates a todo', runTest(function* () {
  const { client } = yield* startTestServer();
  
  yield* Effect.promise(() =>
    client(todoGroup.TodoCreate)({ projectId: 1, title: 'Test Todo' })
  );
  
  const todos = yield* Effect.promise(() =>
    client(todoGroup.TodoGetByProjectId)({ projectId: 1 })
  );
  
  expect(todos).toHaveLength(1);
  expect(todos[0].title).toBe('Test Todo');
}));
```

Each test gets an isolated database, automatically cleaned up via finalizers.

## Client Usage (React Query)

The web client uses React Query with a type-safe RPC wrapper:

```typescript
// Query
const { data: todos } = useQuery(
  rpc.TodoGetByProjectId.queryOptions(
    { projectId: 1 },
    { enabled: true }
  )
);

// Mutation
const createTodo = useMutation(
  rpc.TodoCreate.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: rpc.TodoGetByProjectId.queryKey({ projectId: 1 })
      });
    }
  })
);

createTodo.mutate({ projectId: 1, title: 'New Todo' });
```
