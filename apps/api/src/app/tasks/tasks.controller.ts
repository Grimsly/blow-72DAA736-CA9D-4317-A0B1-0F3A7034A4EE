import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dtos';
import { Task } from '../entities/task.entity';
import { AuthenticatedUser } from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/auth';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<Task> {
    return this.tasksService.createTask(
      createTaskDto,
      user.userId,
      user.organizationId
    );
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<Task[]> {
    return this.tasksService.findAllAccessible(
      user.userId,
      user.role,
      user.organizationId
    );
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<Task> {
    return this.tasksService.updateTask(
      id,
      updateTaskDto,
      user.userId,
      user.role,
      user.organizationId
    );
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<{ message: string }> {
    await this.tasksService.deleteTask(
      id,
      user.userId,
      user.role,
      user.organizationId
    );
    return { message: 'Task deleted successfully' };
  }
}
