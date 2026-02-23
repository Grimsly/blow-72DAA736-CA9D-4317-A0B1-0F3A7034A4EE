import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { Role } from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';
import { CreateTaskDto, UpdateTaskDto } from './tasks.controller';

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

    // Owner can access all tasks in their org hierarchy
    if (userRole === Role.OWNER) {
      return await this.isInOrgHierarchy(task.organizationId, userOrgId);
    }

    // Admin can access tasks in same org
    if (userRole === Role.ADMIN) {
      return task.organizationId === userOrgId;
    }

    // Viewer can only see tasks they created
    return task.createdById === userId;
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
  ) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      createdById: userId,
      organizationId: userOrgId,
    });
    return this.tasksRepository.save(task);
  }

  async findAllAccessible(userId: string, userRole: Role, userOrgId: string) {
    // Implementation depends on role
    if (userRole === Role.OWNER) {
      // Get all orgs in hierarchy
      const orgIds = await this.getOrgHierarchyIds(userOrgId);
      return this.tasksRepository.find({
        where: orgIds.map((id) => ({ organizationId: id })),
      });
    }

    if (userRole === Role.ADMIN) {
      return this.tasksRepository.find({
        where: { organizationId: userOrgId },
      });
    }

    // Viewer only sees their own
    return this.tasksRepository.find({ where: { createdById: userId } });
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
  ) {
    if (userRole === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot edit tasks');
    }

    if (!(await this.canAccessTask(id, userId, userRole, userOrgId))) {
      throw new ForbiddenException('Access denied');
    }

    await this.tasksRepository.update(id, updateTaskDto);
    return this.tasksRepository.findOne({ where: { id } });
  }

  async deleteTask(
    id: string,
    userId: string,
    userRole: Role,
    userOrgId: string
  ) {
    if (userRole === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot delete tasks');
    }

    if (!(await this.canAccessTask(id, userId, userRole, userOrgId))) {
      throw new ForbiddenException('Access denied');
    }

    await this.tasksRepository.delete(id);
  }
}
