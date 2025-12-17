import { Button } from '@/components/ui/button';
import { projects } from '@/lib/db';
import { useLiveQuery } from '@tanstack/react-db';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsList({
  onDelete,
}: {
  onDelete: (id: number) => void;
}) {
  const { data: projectsData } = useLiveQuery(projects);
  const projectsList = projectsData || [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projectsList.map((project) => (
        <Link
          key={project.id}
          href={`/project/${project.id}`}
          className="block"
        >
          <div className="group relative flex h-32 flex-col justify-between rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
            <div>
              <div className="font-medium">{project.name}</div>
              {project.description && (
                <div className="text-sm text-muted-foreground">
                  {project.description}
                </div>
              )}
            </div>
            <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(project.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
