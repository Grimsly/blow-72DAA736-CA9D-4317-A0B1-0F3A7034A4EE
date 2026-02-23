import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  ITask,
  TaskStatus,
} from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';

export interface CreateTaskRequest {
  title: string;
  description: string;
  status?: TaskStatus;
  category?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = '/api/tasks';

  // Reactive state with signals
  tasks = signal<ITask[]>([]);
  loading = signal<boolean>(false);

  getTasks(): Observable<ITask[]> {
    this.loading.set(true);
    return this.http.get<ITask[]>(this.apiUrl).pipe(
      tap((tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      })
    );
  }

  createTask(task: CreateTaskRequest): Observable<ITask> {
    return this.http.post<ITask>(this.apiUrl, task).pipe(
      tap((newTask) => {
        this.tasks.update((tasks) => [newTask, ...tasks]);
      })
    );
  }

  updateTask(id: string, task: UpdateTaskRequest): Observable<ITask> {
    return this.http.put<ITask>(`${this.apiUrl}/${id}`, task).pipe(
      tap((updatedTask) => {
        this.tasks.update((tasks) =>
          tasks.map((t) => (t.id === id ? updatedTask : t))
        );
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
      })
    );
  }
}
