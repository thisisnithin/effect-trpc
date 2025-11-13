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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { rpc } from '@/lib/rpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [newProjectName, setNewProjectName] = useState('');
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');

  // Queries
  const { data: projects, isLoading: projectsLoading } = useQuery(
    rpc.ProjectGetAll.queryOptions(),
  );

  const { data: todos, isLoading: todosLoading } = useQuery(
    rpc.TodoGetByProjectId.queryOptions(
      { projectId: selectedProjectId! },
      {
        enabled: selectedProjectId !== null,
      },
    ),
  );

  // Mutations
  const createProject = useMutation(
    rpc.ProjectCreate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: rpc.ProjectGetAll.queryKey(),
        });
        setNewProjectName('');
      },
    }),
  );

  const createTodo = useMutation(
    rpc.TodoCreate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: rpc.TodoGetByProjectId.queryKey({
            projectId: selectedProjectId!,
          }),
        });
        setNewTodoTitle('');
        setNewTodoDescription('');
      },
    }),
  );

  const toggleTodo = useMutation(
    rpc.TodoToggle.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: rpc.TodoGetByProjectId.queryKey({
            projectId: selectedProjectId!,
          }),
        });
      },
    }),
  );

  const deleteTodo = useMutation(
    rpc.TodoDelete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: rpc.TodoGetByProjectId.queryKey({
            projectId: selectedProjectId!,
          }),
        });
      },
    }),
  );

  const deleteProject = useMutation(
    rpc.ProjectDelete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: rpc.ProjectGetAll.queryKey(),
        });
        setSelectedProjectId(null);
      },
    }),
  );

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      createProject.mutate({ name: newProjectName });
    }
  };

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoTitle.trim() && selectedProjectId) {
      createTodo.mutate({
        projectId: selectedProjectId,
        title: newTodoTitle,
        description: newTodoDescription || undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-4xl font-bold text-foreground">Todo App</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Projects Section */}
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Create and manage your projects</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="mb-4 space-y-2">
                <Label htmlFor="project-name">New Project</Label>
                <div className="flex gap-2">
                  <Input
                    id="project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    disabled={createProject.isPending}
                  />
                  <Button type="submit" disabled={createProject.isPending}>
                    Add
                  </Button>
                </div>
              </form>

              {projectsLoading ? (
                <div>Loading projects...</div>
              ) : (
                <div className="space-y-2">
                  {projects?.map((project) => (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent cursor-pointer ${
                        selectedProjectId === project.id
                          ? 'border-primary bg-accent'
                          : ''
                      }`}
                      onClick={() => setSelectedProjectId(project.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div>
                        <div className="font-medium">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-muted-foreground">
                            {project.description}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject.mutate({ id: project.id });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Todos Section */}
          <Card>
            <CardHeader>
              <CardTitle>Todos</CardTitle>
              <CardDescription>
                {selectedProjectId
                  ? 'Manage todos for selected project'
                  : 'Select a project to add todos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProjectId && (
                <form onSubmit={handleCreateTodo} className="mb-4 space-y-2">
                  <Label htmlFor="todo-title">New Todo</Label>
                  <Input
                    id="todo-title"
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    placeholder="Enter todo title"
                    disabled={createTodo.isPending}
                  />
                  <Textarea
                    value={newTodoDescription}
                    onChange={(e) => setNewTodoDescription(e.target.value)}
                    placeholder="Enter description (optional)"
                    disabled={createTodo.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={createTodo.isPending}
                    className="w-full"
                  >
                    Add Todo
                  </Button>
                </form>
              )}

              {todosLoading ? (
                <div>Loading todos...</div>
              ) : (
                <div className="space-y-2">
                  {todos?.map((todo) => (
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
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTodo.mutate({ id: todo.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
