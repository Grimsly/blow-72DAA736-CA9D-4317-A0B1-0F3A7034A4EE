import { TaskStatus } from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';

export interface CreateTaskDto {
  title: string;
  description: string;
  status?: TaskStatus;
  category?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: string;
}
