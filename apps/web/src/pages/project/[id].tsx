'use client';

import { rpc } from '@/lib/rpc';
import type { DragEndEvent } from '@dnd-kit/core';
import { TodoStatus } from '@repo/rpc';
import { useMutation } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState } from 'react';

const COLUMNS: { id: TodoStatus; name: string; color: string }[] = [
  { id: 'todo', name: 'Planned', color: '#6B7280' },
  { id: 'in-progress', name: 'In Progress', color: '#F59E0B' },
  { id: 'done', name: 'Done', color: '#10B981' },
];

const KanbanContent = dynamic(() => import('@/components/KanbanContent'), {
  ssr: false,
});

export default function ProjectBoard() {
  const router = useRouter();
  const { id } = router.query;
  const projectId = id ? Number(id) : null;

  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(
    null,
  );

  // Mutations
  const createTodo = useMutation(rpc.TodoCreate.mutationOptions());
  const updateTodo = useMutation(rpc.TodoUpdate.mutationOptions());
  const deleteTodo = useMutation(rpc.TodoDelete.mutationOptions());

  const handleCreateCard = async (columnId: string) => {
    if (newCardTitle.trim() && projectId) {
      createTodo.mutate({
        projectId,
        title: newCardTitle,
        status: columnId as TodoStatus,
      });
      setNewCardTitle('');
      setAddingCardToColumn(null);
    }
  };

  const handleDragEnd = async (
    event: DragEndEvent,
    todosData: Array<{ id: number; status: TodoStatus }>,
  ) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = over.id;

    const card = todosData?.find((t) => t.id === activeId);
    if (!card) return;

    let newColumnId = card.status;

    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      newColumnId = overColumn.id;
    } else {
      const overCard = todosData?.find((t) => String(t.id) === overId);
      if (overCard) {
        newColumnId = overCard.status;
      }
    }

    if (newColumnId !== card.status) {
      updateTodo.mutate({
        id: activeId,
        data: { status: newColumnId },
      });
    }
  };

  const handleDeleteTodo = async (id: number) => {
    console.log('handleDeleteTodo', id);
    deleteTodo.mutate({ id });
  };

  if (!projectId) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <KanbanContent
      projectId={projectId}
      columns={COLUMNS}
      newCardTitle={newCardTitle}
      setNewCardTitle={setNewCardTitle}
      addingCardToColumn={addingCardToColumn}
      setAddingCardToColumn={setAddingCardToColumn}
      onCreateCard={handleCreateCard}
      onDragEnd={handleDragEnd}
      onDeleteTodo={handleDeleteTodo}
    />
  );
}
