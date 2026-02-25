import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { Role } from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';
import { CreateTaskDto, UpdateTaskDto } from './dtos';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Organization)
    private orgsRepository: Repository<Organization>
  ) {}

  async canAccessTask(
    taskId: string,
    userId: string,
    userRole: Role,
    userOrgId: string
  ): Promise<boolean> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    switch (userRole) {
      // Owner can access all tasks in their org hierarchy
      case Role.OWNER:
        return await this.isInOrgHierarchy(task.organizationId, userOrgId);
      // Admin can access tasks in same org
      case Role.ADMIN:
        return task.organizationId === userOrgId;
      // Viewer can only see tasks they created
      case Role.VIEWER:
        return task.createdById === userId;
      // Reject all roles that are unknown
      default:
        return false;
    }
  }

  async isInOrgHierarchy(
    childOrgId: string,
    parentOrgId: string
  ): Promise<boolean> {
    if (childOrgId === parentOrgId) return true;

    const org = await this.orgsRepository.findOne({
      where: { id: childOrgId },
    });
    if (!org || !org.parentId) return false;

    return this.isInOrgHierarchy(org.parentId, parentOrgId);
  }

  async createTask(
    createTaskDto: CreateTaskDto,
    userId: string,
    userOrgId: string
  ): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      createdById: userId,
      organizationId: userOrgId,
    });
    return this.tasksRepository.save(task);
  }

  async findAllAccessible(
    userId: string,
    userRole: Role,
    userOrgId: string
  ): Promise<Task[]> {
    switch (userRole) {
      case Role.OWNER: {
        const orgIds = await this.getOrgHierarchyIds(userOrgId);
        return this.tasksRepository.find({
          where: { organizationId: In(orgIds) },
          order: { createdAt: 'DESC' },
        });
      }
      case Role.ADMIN:
        return this.tasksRepository.find({
          where: { organizationId: userOrgId },
          order: { createdAt: 'DESC' },
        });
      // Only return tasks created by the user
      case Role.VIEWER:
        return this.tasksRepository.find({
          where: { createdById: userId },
          order: { createdAt: 'DESC' },
        });
      // In the case for some reason the role is unknown, return nothing
      default:
        return [];
    }
  }

  async getOrgHierarchyIds(orgId: string): Promise<string[]> {
    const ids = [orgId];
    const children = await this.orgsRepository.find({
      where: { parentId: orgId },
    });
    for (const child of children) {
      ids.push(...(await this.getOrgHierarchyIds(child.id)));
    }
    return ids;
  }

  async updateTask(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
    userRole: Role,
    userOrgId: string
  ): Promise<Task> {
    if (userRole === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot edit tasks');
    }

    if (!(await this.canAccessTask(id, userId, userRole, userOrgId))) {
      throw new ForbiddenException('Access denied');
    }

    await this.tasksRepository.update(id, updateTaskDto);
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async deleteTask(
    id: string,
    userId: string,
    userRole: Role,
    userOrgId: string
  ): Promise<void> {
    if (userRole === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot delete tasks');
    }

    if (!(await this.canAccessTask(id, userId, userRole, userOrgId))) {
      throw new ForbiddenException('Access denied');
    }

    await this.tasksRepository.delete(id);
  }
}
