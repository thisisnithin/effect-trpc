import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/kanban';
import { createProjectCollection, createTodosCollection } from '@/lib/db';
import type { DragEndEvent } from '@dnd-kit/core';
import { TodoStatus } from '@repo/rpc';
import { useLiveQuery } from '@tanstack/react-db';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

interface KanbanContentProps {
  projectId: number;
  columns: Array<{ id: TodoStatus; name: string; color: string }>;
  newCardTitle: string;
  setNewCardTitle: (title: string) => void;
  addingCardToColumn: string | null;
  setAddingCardToColumn: (column: string | null) => void;
  onCreateCard: (columnId: string) => void;
  onDragEnd: (
    event: DragEndEvent,
    todosData: Array<{ id: number; status: TodoStatus }>,
  ) => void;
  onDeleteTodo: (id: number) => void;
}

export default function KanbanContent({
  projectId,
  columns,
  newCardTitle,
  setNewCardTitle,
  addingCardToColumn,
  setAddingCardToColumn,
  onCreateCard,
  onDragEnd,
  onDeleteTodo,
}: KanbanContentProps) {
  const projectCollection = useMemo(
    () => createProjectCollection(projectId),
    [projectId],
  );

  const todosCollection = useMemo(
    () => createTodosCollection(projectId),
    [projectId],
  );

  const { data: projectData } = useLiveQuery(projectCollection);

  const { data: todosData } = useLiveQuery(todosCollection);

  const features =
    todosData?.map((todo) => ({
      id: String(todo.id),
      name: todo.title,
      column: todo.status,
      description: todo.description,
    })) || [];

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">{projectData?.[0]?.name}</h1>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <KanbanProvider
          columns={columns}
          data={features}
          onDragEnd={(e) => onDragEnd(e, todosData || [])}
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id}>
              <KanbanHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span>{column.name}</span>
                </div>
              </KanbanHeader>

              <KanbanCards id={column.id}>
                {(feature: (typeof features)[number]) => (
                  <KanbanCard
                    column={column.id}
                    id={feature.id}
                    key={feature.id}
                    name={feature.name}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <p className="m-0 flex-1 font-medium text-sm">
                          {feature.name}
                        </p>
                        {feature.description && (
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTodo(Number(feature.id));
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </KanbanCard>
                )}
              </KanbanCards>

              <div className="p-2">
                {addingCardToColumn === column.id ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      autoFocus
                      placeholder="Card title"
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onCreateCard(column.id);
                        } else if (e.key === 'Escape') {
                          setAddingCardToColumn(null);
                          setNewCardTitle('');
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onCreateCard(column.id)}>
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAddingCardToColumn(null);
                          setNewCardTitle('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setAddingCardToColumn(column.id);
                      setNewCardTitle('');
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Card
                  </Button>
                )}
              </div>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
}
