import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  HostListener,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDrag,
  CdkDropList,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import {
  ITask,
  TaskStatus,
  Role,
} from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';

type SortOption = 'date' | 'title';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDrag, CdkDropList],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TasksComponent implements OnInit {
  taskService = inject(TaskService);
  authService = inject(AuthService);

  TaskStatus = TaskStatus;
  Role = Role;

  // Dark mode
  darkMode = signal(false);

  // Filters
  selectedCategory = signal<string>('all');
  searchQuery = signal('');

  constructor() {
    // Watch for filter changes and update arrays
    effect(() => {
      this.selectedCategory();
      this.searchQuery();
      // Delay to ensure computed signal updates first
      setTimeout(() => this.updateLocalArrays(), 0);
    });
  }

  // Modals
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);

  // New initial task form
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
  selectedTaskId = signal<string | null>(null);
  taskToDelete = signal<string | null>(null);

  // Trigger for stats update
  statsUpdateTrigger = signal(0);

  // Local arrays for drag-drop (mutable)
  todoTasksArray: ITask[] = [];
  inProgressTasksArray: ITask[] = [];
  doneTasksArray: ITask[] = [];

  // Computed values
  categories = computed(() => {
    const cats = new Set(
      this.taskService
        .tasks()
        .map((t) => t.category)
        .filter(Boolean)
    );
    return Array.from(cats);
  });

  filteredTasks = computed(() => {
    let tasks = [...this.taskService.tasks()];

    // Filter by search (starts with match on title)
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      tasks = tasks.filter((t) => {
        const titleWords = t.title.toLowerCase().split(' ');
        return titleWords.some((word) => word.startsWith(query));
      });
    }

    // Filter by category
    if (this.selectedCategory() !== 'all') {
      tasks = tasks.filter((t) => t.category === this.selectedCategory());
    }

    return tasks;
  });

  // Stats for visualization - reactive to trigger
  stats = computed(() => {
    // React to trigger changes
    this.statsUpdateTrigger();

    const todo = this.todoTasksArray.length;
    const inProgress = this.inProgressTasksArray.length;
    const done = this.doneTasksArray.length;
    const total = todo + inProgress + done;

    return {
      total,
      todo,
      todoPercent: total ? (todo / total) * 100 : 0,
      inProgress,
      inProgressPercent: total ? (inProgress / total) * 100 : 0,
      done,
      donePercent: total ? (done / total) * 100 : 0,
    };
  });

  ngOnInit(): void {
    this.taskService.getTasks().subscribe(() => {
      this.updateLocalArrays();
    });
    this.loadDarkMode();
  }

  // Update local arrays when tasks change
  updateLocalArrays(): void {
    const filtered = this.filteredTasks();
    this.todoTasksArray = filtered.filter((t) => t.status === TaskStatus.TODO);
    this.inProgressTasksArray = filtered.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS
    );
    this.doneTasksArray = filtered.filter((t) => t.status === TaskStatus.DONE);
    // Trigger stats update
    this.statsUpdateTrigger.update((v) => v + 1);
  }

  // Keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ctrl+K or Cmd+K for search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      document.getElementById('search-input')?.focus();
    }

    // Ctrl+M or Cmd+M for new task modal
    if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
      event.preventDefault();
      this.openCreateModal();
    }

    // Delete key to delete selected task
    if (event.key === 'Delete' && this.selectedTaskId()) {
      event.preventDefault();

      const selected_task_id = this.selectedTaskId();

      if (selected_task_id && this.canEditTask()) {
        this.openDeleteModal(selected_task_id);
      }
    }

    // Escape to close modals or deselect
    if (event.key === 'Escape') {
      this.showCreateModal.set(false);
      this.showEditModal.set(false);
      this.showDeleteModal.set(false);
      this.selectedTaskId.set(null);
    }
  }

  // Dark mode
  toggleDarkMode(): void {
    this.darkMode.update((v) => !v);
    localStorage.setItem('darkMode', this.darkMode().toString());
    this.applyDarkMode();
  }

  loadDarkMode(): void {
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      this.darkMode.set(saved === 'true');
      this.applyDarkMode();
    }
  }

  applyDarkMode(): void {
    if (this.darkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Sorting (one-time action)
  sortTasksBy(option: SortOption): void {
    const tasks = this.taskService.tasks();
    const sorted = [...tasks];

    switch (option) {
      case 'date':
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    this.taskService.tasks.set(sorted);
    this.updateLocalArrays();
  }

  drop(event: CdkDragDrop<ITask[]>): void {
    if (!this.canEditTask()) return;

    if (event.previousContainer === event.container) {
      // Reordering within same list
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.syncToService();
    } else {
      // Moving between lists - change status
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = this.getStatusFromContainer(event.container.data);

      if (!newStatus) return;

      const updatedTask = { ...task, status: newStatus };

      event.previousContainer.data.splice(event.previousIndex, 1);
      event.container.data.splice(event.currentIndex, 0, updatedTask);

      this.syncToService();

      // Update in backend
      this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
        error: (err) => {
          alert('Failed to update task: ' + err.message);
          // Revert on error
          this.updateLocalArrays();
        },
      });
    }
  }

  getStatusFromContainer(containerData: ITask[]): TaskStatus | null {
    if (containerData === this.todoTasksArray) return TaskStatus.TODO;
    if (containerData === this.inProgressTasksArray)
      return TaskStatus.IN_PROGRESS;
    if (containerData === this.doneTasksArray) return TaskStatus.DONE;
    return null;
  }

  // Sync local arrays back to service
  syncToService(): void {
    const allTasks = [
      ...this.todoTasksArray,
      ...this.inProgressTasksArray,
      ...this.doneTasksArray,
    ];
    this.taskService.tasks.set(allTasks);
    // Trigger stats update
    this.statsUpdateTrigger.update((v) => v + 1);
  }

  // Task selection
  selectTask(taskId: string): void {
    this.selectedTaskId.set(taskId);
  }

  isTaskSelected(taskId: string): boolean {
    return this.selectedTaskId() === taskId;
  }

  // Modals
  openCreateModal(): void {
    this.newTask = {
      title: '',
      description: '',
      status: TaskStatus.TODO,
      category: '',
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  openEditModal(task: ITask): void {
    this.editingTaskId.set(task.id);
    this.editTask = {
      title: task.title,
      description: task.description,
      status: task.status,
      category: task.category || '',
    };
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingTaskId.set(null);
  }

  openDeleteModal(id: string): void {
    this.taskToDelete.set(id);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.taskToDelete.set(null);
  }

  confirmDelete(): void {
    const id = this.taskToDelete();
    if (!id) return;

    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.selectedTaskId.set(null);
        this.closeDeleteModal();
        this.updateLocalArrays();
      },
      error: (err) => alert('Failed to delete task: ' + err.message),
    });
  }

  canCreateTask(): boolean {
    return true;
  }

  canEditTask(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === Role.OWNER || role === Role.ADMIN;
  }

  createTask(): void {
    if (!this.newTask.title || !this.newTask.description) return;

    this.taskService.createTask(this.newTask).subscribe({
      next: () => {
        this.closeCreateModal();
        this.updateLocalArrays();
      },
      error: (err) => alert('Failed to create task: ' + err.message),
    });
  }

  saveTask(): void {
    const editing_task_id = this.editingTaskId();

    if (!editing_task_id) return;

    this.taskService.updateTask(editing_task_id, this.editTask).subscribe({
      next: () => {
        this.closeEditModal();
        this.updateLocalArrays();
      },
      error: (err) => alert('Failed to update task: ' + err.message),
    });
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
