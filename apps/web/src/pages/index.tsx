'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rpc } from '@/lib/rpc';
import { useMutation } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const ProjectsList = dynamic(() => import('@/components/ProjectsList'), {
  ssr: false,
});

export default function Home() {
  const [newProjectName, setNewProjectName] = useState('');

  // Mutations
  const createProject = useMutation(rpc.ProjectCreate.mutationOptions());
  const deleteProject = useMutation(rpc.ProjectDelete.mutationOptions());

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      createProject.mutate({ name: newProjectName });
      setNewProjectName('');
    }
  };

  const handleDeleteProject = async (id: number) => {
    deleteProject.mutate({ id });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold text-foreground">Projects</h1>

        <Card>
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
            <CardDescription>Create and manage your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="mb-6 space-y-2">
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

            <ProjectsList onDelete={handleDeleteProject} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
