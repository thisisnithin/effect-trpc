'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { rpc } from '@/lib/rpc';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function InfiniteExample() {
  const queryClient = useQueryClient();
  const [selectedProjectId] = useState<number>(1);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(
      rpc.TodoGetByProjectIdPaginated.infiniteQueryOptions(
        (pageParam) => ({
          projectId: selectedProjectId,
          cursor: pageParam,
          limit: 5,
        }),
        {
          initialPageParam: 0,
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        },
      ),
    );

  const toggleTodo = useMutation(
    rpc.TodoToggle.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: rpc.TodoGetByProjectIdPaginated.infiniteQueryKey(),
        });
      },
    }),
  );

  const allTodos = data?.pages.flatMap((page) => page.todos) ?? [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Infinite Scroll Example</CardTitle>
            <CardDescription>
              Todos are loaded in pages of 5. Click "Load More" to fetch the
              next page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {allTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() =>
                          toggleTodo.mutate({ id: todo.id })
                        }
                        disabled={toggleTodo.isPending}
                      />
                      <div className="flex-1">
                        <div
                          className={`font-medium ${
                            todo.completed
                              ? 'line-through text-muted-foreground'
                              : ''
                          }`}
                        >
                          {todo.title}
                        </div>
                        {todo.description && (
                          <div className="text-sm text-muted-foreground">
                            {todo.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          ID: {todo.id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {hasNextPage && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}

                {!hasNextPage && allTodos.length > 0 && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    No more todos to load
                  </div>
                )}

                <div className="mt-4 text-xs text-muted-foreground">
                  Loaded {allTodos.length} todos across{' '}
                  {data?.pages.length ?? 0} pages
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
