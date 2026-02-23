export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category?: string;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
