# Effect + tRPC + Bun Todo App

Effect-native app demonstrating config, services, DI, transactions, and testing patterns.

## Setup

```bash
bun install
bun dev      # Development
bun test     # Tests
```

## Architecture

### 1. Configuration

Type-safe config using Effect's `Config` module with validation:

```typescript
const logLevel = Config.string('LOG_LEVEL')
  .pipe(Config.withDefault('Info'), Config.validate(...))

export const AppConfig = Config.all({ logLevel, nodeEnv, dbPath })
```

Config is accessed via dependency injection in layers.

### 2. Services & Dependency Injection

Services defined with `Effect.Service` — dependencies injected via `yield*`:

```typescript
export class TodoService extends Effect.Service<TodoService>()('TodoService', {
  effect: Effect.gen(function* () {
    const db = yield* Db  // Dependency injection
    
    const create = (input) => Effect.gen(function* () { ... })
    return { create, getAll, ... }
  })
}) {}
```

**Layer composition** wires dependencies:

```typescript
const AppLive = ServerLive.pipe(
  Layer.provide(TodoService.Default),
  Layer.provide(DbLive),
  Layer.provide(LoggerLive)
)
```

### 3. Transactions

Use `sql.withTransaction` to wrap Effect workflows:

```typescript
const createWithTodos = (input) => {
  return sql.withTransaction(
    Effect.gen(function* () {
      const project = yield* db.insert(...)
      const todos = yield* Effect.all(...)  // All-or-nothing
      return { project, todos }
    })
  )
}
```

Automatic rollback on failure.

### 4. Testing

Tests use `Effect.scoped` for automatic cleanup:

```typescript
export function runTest(f) {
  return () => Effect.runPromise(Effect.scoped(Effect.gen(f)))
}

it('test', runTest(function* () {
  const { client } = yield* startTestServer()  // Auto cleanup
  const result = yield* Effect.promise(() => client.todo.create(...))
  expect(result.title).toBe('...')
}))
```

Each test gets isolated DB, cleaned up via finalizers.

### 5. Error Handling

Define base errors with `Data.TaggedError`:

```typescript
export class NotFoundError extends Data.TaggedError('NotFoundError')<{
  message: string
  cause?: unknown
}> {}
```

Extend base errors for domain-specific cases:

```typescript
export class TodoNotFoundError extends NotFoundError {
  constructor(id: number) {
    super({ message: `Todo with id ${id} not found` })
  }
}
```

Return typed errors from services:

```typescript
if (result.length === 0) {
  return yield* Effect.fail(new TodoNotFoundError(id))
}
```

At the tRPC boundary, use the `run` helper to automatically handle errors:

```typescript
export const todoRouter = router({
  create: publicProcedure
    .input(z.object({ title: z.string() }))
    .mutation(
      run(function* ({ input }) {
        const todoService = yield* TodoService
        return yield* todoService.create(input)
      })
    )
})
```

The `run` helper:
- Extracts `runtime` from context automatically
- Wraps your generator with `Effect.gen`
- Maps Effect errors to TRPCErrors via `withErrorHandling`
- Logs unexpected errors for debugging

```typescript
export async function withErrorHandling(runtime, effect) {
  const exit = await Runtime.runPromiseExit(runtime)(effect)
  
  if (exit._tag === 'Success') return exit.value
  
  const failure = Cause.failureOption(exit.cause)
  if (failure._tag === 'Some' && failure.value instanceof NotFoundError) {
    throw new TRPCError({ code: 'NOT_FOUND', message: ... })
  }
  // ... other error types
  
  // Unexpected errors are logged
  await Runtime.runPromise(runtime)(
    Effect.logError('Unexpected error', { cause: Cause.pretty(exit.cause) })
  )
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', ... })
}
```

Errors flow through Effect as values until the boundary throws for tRPC.
