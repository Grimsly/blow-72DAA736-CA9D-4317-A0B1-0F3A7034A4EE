import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import {
  ITask,
  TaskStatus,
  Role,
} from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow">
        <div
          class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center"
        >
          <h1 class="text-2xl font-bold text-gray-900">Task Manager</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">
              {{ authService.currentUser()?.email }} ({{
                authService.currentUser()?.role
              }})
            </span>
            <button
              (click)="authService.logout()"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Create Task Form -->
        @if (canCreateTask()) {
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Create New Task</h2>
          <form (ngSubmit)="createTask()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Title</label
              >
              <input
                type="text"
                [(ngModel)]="newTask.title"
                name="title"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Description</label
              >
              <textarea
                [(ngModel)]="newTask.description"
                name="description"
                rows="3"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              ></textarea>
            </div>
            <div class="flex gap-4">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700"
                  >Status</label
                >
                <select
                  [(ngModel)]="newTask.status"
                  name="status"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option [value]="TaskStatus.TODO">To Do</option>
                  <option [value]="TaskStatus.IN_PROGRESS">In Progress</option>
                  <option [value]="TaskStatus.DONE">Done</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700"
                  >Category</label
                >
                <input
                  type="text"
                  [(ngModel)]="newTask.category"
                  name="category"
                  placeholder="Work, Personal, etc."
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Task
            </button>
          </form>
        </div>
        }

        <!-- Task List -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold">My Tasks</h2>
          </div>

          @if (taskService.loading()) {
          <div class="p-6 text-center text-gray-500">Loading tasks...</div>
          } @else if (taskService.tasks().length === 0) {
          <div class="p-6 text-center text-gray-500">No tasks found</div>
          } @else {
          <ul class="divide-y divide-gray-200">
            @for (task of taskService.tasks(); track task.id) {
            <li class="p-6 hover:bg-gray-50">
              @if (editingTaskId() === task.id) {
              <!-- Edit Mode -->
              <div class="space-y-4">
                <input
                  type="text"
                  [(ngModel)]="editTask.title"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
                <textarea
                  [(ngModel)]="editTask.description"
                  rows="3"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                ></textarea>
                <div class="flex gap-4">
                  <select
                    [(ngModel)]="editTask.status"
                    class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  >
                    <option [value]="TaskStatus.TODO">To Do</option>
                    <option [value]="TaskStatus.IN_PROGRESS">
                      In Progress
                    </option>
                    <option [value]="TaskStatus.DONE">Done</option>
                  </select>
                  <input
                    type="text"
                    [(ngModel)]="editTask.category"
                    placeholder="Category"
                    class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  />
                </div>
                <div class="flex gap-2">
                  <button
                    (click)="saveTask(task.id)"
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    (click)="cancelEdit()"
                    class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              } @else {
              <!-- View Mode -->
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-lg font-medium text-gray-900">
                    {{ task.title }}
                  </h3>
                  <p class="mt-1 text-sm text-gray-600">
                    {{ task.description }}
                  </p>
                  <div class="mt-2 flex gap-2">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-yellow-100]="task.status === TaskStatus.TODO"
                      [class.text-yellow-800]="task.status === TaskStatus.TODO"
                      [class.bg-blue-100]="
                        task.status === TaskStatus.IN_PROGRESS
                      "
                      [class.text-blue-800]="
                        task.status === TaskStatus.IN_PROGRESS
                      "
                      [class.bg-green-100]="task.status === TaskStatus.DONE"
                      [class.text-green-800]="task.status === TaskStatus.DONE"
                    >
                      {{ getStatusLabel(task.status) }}
                    </span>
                    @if (task.category) {
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {{ task.category }}
                    </span>
                    }
                  </div>
                </div>

                @if (canEditTask()) {
                <div class="flex gap-2">
                  <button
                    (click)="startEdit(task)"
                    class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    (click)="deleteTaskConfirm(task.id)"
                    class="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
                }
              </div>
              }
            </li>
            }
          </ul>
          }
        </div>
      </main>
    </div>
  `,
})
export class TasksComponent implements OnInit {
  taskService = inject(TaskService);
  authService = inject(AuthService);

  TaskStatus = TaskStatus;

  newTask = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    category: '',
  };

  editTask = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    category: '',
  };

  editingTaskId = signal<string | null>(null);

  ngOnInit(): void {
    this.taskService.getTasks().subscribe();
  }

  canCreateTask(): boolean {
    return true; // All users can create tasks
  }

  canEditTask(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === Role.OWNER || role === Role.ADMIN;
  }

  createTask(): void {
    if (!this.newTask.title || !this.newTask.description) return;

    this.taskService.createTask(this.newTask).subscribe({
      next: () => {
        this.newTask = {
          title: '',
          description: '',
          status: TaskStatus.TODO,
          category: '',
        };
      },
      error: (err) => alert('Failed to create task: ' + err.message),
    });
  }

  startEdit(task: ITask): void {
    this.editingTaskId.set(task.id);
    this.editTask = {
      title: task.title,
      description: task.description,
      status: task.status,
      category: task.category || '',
    };
  }

  saveTask(id: string): void {
    this.taskService.updateTask(id, this.editTask).subscribe({
      next: () => {
        this.editingTaskId.set(null);
      },
      error: (err) => alert('Failed to update task: ' + err.message),
    });
  }

  cancelEdit(): void {
    this.editingTaskId.set(null);
  }

  deleteTaskConfirm(id: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        error: (err) => alert('Failed to delete task: ' + err.message),
      });
    }
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'To Do';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.DONE:
        return 'Done';
      default:
        return status;
    }
  }
}
