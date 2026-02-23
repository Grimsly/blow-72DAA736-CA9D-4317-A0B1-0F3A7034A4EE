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
import {
  JwtAuthGuard,
  CurrentUser,
  JwtPayload,
} from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/auth';
import { TasksService } from './tasks.service';
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

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.tasksService.createTask(
      createTaskDto,
      user.sub,
      user.organizationId
    );
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.tasksService.findAllAccessible(
      user.sub,
      user.role,
      user.organizationId
    );
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.tasksService.updateTask(
      id,
      updateTaskDto,
      user.sub,
      user.role,
      user.organizationId
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tasksService.deleteTask(
      id,
      user.sub,
      user.role,
      user.organizationId
    );
  }
}
