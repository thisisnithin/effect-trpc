'use client';

import { Project, Todo } from '@repo/rpc';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { QueryClient } from '@tanstack/react-query';
import { Schema } from 'effect';

// Initialize QueryClient
export const queryClient = new QueryClient();

type ProjectType = Schema.Schema.Type<typeof Project>;
type TodoType = Schema.Schema.Type<typeof Todo>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const projects = createCollection(
  electricCollectionOptions<ProjectType>({
    id: 'projects',
    getKey: (item) => item.id,
    shapeOptions: {
      url: `${API_URL}/shape/projects`,
      params: {},
    },
  }),
);

export const createProjectCollection = (projectId: number) => {
  console.log('createProjectCollection', projectId);
  return createCollection(
    electricCollectionOptions<ProjectType>({
      id: `project-${projectId}`,
      getKey: (item) => item.id,
      shapeOptions: {
        url: `${API_URL}/shape/projects`,
        params: {
          projectId: projectId.toString(),
        },
      },
    }),
  );
};

export const createTodosCollection = (projectId: number) => {
  console.log('createTodosCollection', projectId);
  return createCollection(
    electricCollectionOptions<TodoType>({
      id: `todos-${projectId}`,
      getKey: (item) => item.id,
      shapeOptions: {
        url: `${API_URL}/shape/todos`,
        params: {
          projectId: projectId.toString(),
        },
      },
    }),
  );
};
