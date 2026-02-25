import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import {
  Role,
  TaskStatus,
} from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let orgRepository: jest.Mocked<Repository<Organization>>;

  const mockTask: Task = {
    id: 'task1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    category: 'Work',
    organizationId: 'org1',
    createdById: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Task;

  const mockOrg: Organization = {
    id: 'org1',
    name: 'Test Org',
    parentId: null,
  } as Organization;

  beforeEach(async () => {
    const mockTaskRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockOrgRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrgRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    orgRepository = module.get(getRepositoryToken(Organization));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const createDto = {
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.TODO,
      };

      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      const result = await service.createTask(createDto, 'user1', 'org1');

      expect(result).toEqual(mockTask);
      expect(taskRepository.create).toHaveBeenCalledWith({
        ...createDto,
        createdById: 'user1',
        organizationId: 'org1',
      });
    });
  });

  describe('canAccessTask', () => {
    it('should allow OWNER to access task in org hierarchy', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      jest.spyOn(service, 'isInOrgHierarchy').mockResolvedValue(true);

      const result = await service.canAccessTask(
        'task1',
        'user1',
        Role.OWNER,
        'org1'
      );

      expect(result).toBe(true);
    });

    it('should allow ADMIN to access task in same org', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.canAccessTask(
        'task1',
        'user1',
        Role.ADMIN,
        'org1'
      );

      expect(result).toBe(true);
    });

    it('should prevent ADMIN from accessing task in different org', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.canAccessTask(
        'task1',
        'user1',
        Role.ADMIN,
        'org2'
      );

      expect(result).toBe(false);
    });

    it('should allow VIEWER to access their own task', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.canAccessTask(
        'task1',
        'user1',
        Role.VIEWER,
        'org1'
      );

      expect(result).toBe(true);
    });

    it('should prevent VIEWER from accessing other users tasks', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.canAccessTask(
        'task1',
        'user2',
        Role.VIEWER,
        'org1'
      );

      expect(result).toBe(false);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.canAccessTask('nonexistent', 'user1', Role.OWNER, 'org1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('isInOrgHierarchy', () => {
    it('should return true if child and parent are same org', async () => {
      const result = await service.isInOrgHierarchy('org1', 'org1');
      expect(result).toBe(true);
    });

    it('should return true if org is in parent hierarchy', async () => {
      const childOrg = { ...mockOrg, id: 'org2', parentId: 'org1' };
      orgRepository.findOne.mockResolvedValue(childOrg);

      const result = await service.isInOrgHierarchy('org2', 'org1');
      expect(result).toBe(true);
    });

    it('should return false if org is not in hierarchy', async () => {
      orgRepository.findOne.mockResolvedValue(mockOrg);

      const result = await service.isInOrgHierarchy('org1', 'org999');
      expect(result).toBe(false);
    });
  });

  describe('findAllAccessible', () => {
    it('should return all tasks in hierarchy for OWNER', async () => {
      const tasks = [mockTask];
      taskRepository.find.mockResolvedValue(tasks);
      orgRepository.find.mockResolvedValue([]);
      jest.spyOn(service, 'getOrgHierarchyIds').mockResolvedValue(['org1']);

      const result = await service.findAllAccessible(
        'user1',
        Role.OWNER,
        'org1'
      );

      expect(result).toEqual(tasks);
    });

    it('should return only same org tasks for ADMIN', async () => {
      const tasks = [mockTask];
      taskRepository.find.mockResolvedValue(tasks);

      const result = await service.findAllAccessible(
        'user1',
        Role.ADMIN,
        'org1'
      );

      expect(result).toEqual(tasks);
      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return only own tasks for VIEWER', async () => {
      const tasks = [mockTask];
      taskRepository.find.mockResolvedValue(tasks);

      const result = await service.findAllAccessible(
        'user1',
        Role.VIEWER,
        'org1'
      );

      expect(result).toEqual(tasks);
      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { createdById: 'user1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updateTask', () => {
    it('should prevent VIEWER from updating tasks', async () => {
      await expect(
        service.updateTask('task1', {}, 'user1', Role.VIEWER, 'org1')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to update accessible task', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      jest.spyOn(service, 'canAccessTask').mockResolvedValue(true);
      taskRepository.update.mockResolvedValue(undefined as any);

      const updateDto = { title: 'Updated Title' };
      const result = await service.updateTask(
        'task1',
        updateDto,
        'user1',
        Role.ADMIN,
        'org1'
      );

      expect(taskRepository.update).toHaveBeenCalledWith('task1', updateDto);
      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenException if user cannot access task', async () => {
      jest.spyOn(service, 'canAccessTask').mockResolvedValue(false);

      await expect(
        service.updateTask('task1', {}, 'user1', Role.ADMIN, 'org1')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteTask', () => {
    it('should prevent VIEWER from deleting tasks', async () => {
      await expect(
        service.deleteTask('task1', 'user1', Role.VIEWER, 'org1')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to delete accessible task', async () => {
      jest.spyOn(service, 'canAccessTask').mockResolvedValue(true);
      taskRepository.delete.mockResolvedValue(undefined as any);

      await service.deleteTask('task1', 'user1', Role.ADMIN, 'org1');

      expect(taskRepository.delete).toHaveBeenCalledWith('task1');
    });

    it('should throw ForbiddenException if user cannot access task', async () => {
      jest.spyOn(service, 'canAccessTask').mockResolvedValue(false);

      await expect(
        service.deleteTask('task1', 'user1', Role.ADMIN, 'org1')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getOrgHierarchyIds', () => {
    it('should return only org id when no children', async () => {
      orgRepository.find.mockResolvedValue([]);

      const result = await service.getOrgHierarchyIds('org1');

      expect(result).toEqual(['org1']);
    });

    it('should return org and all descendant ids', async () => {
      const childOrg = { id: 'org2', parentId: 'org1' } as Organization;
      orgRepository.find
        .mockResolvedValueOnce([childOrg])
        .mockResolvedValueOnce([]);

      const result = await service.getOrgHierarchyIds('org1');

      expect(result).toContain('org1');
      expect(result).toContain('org2');
    });
  });
});
