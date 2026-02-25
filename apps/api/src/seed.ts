import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './app/entities/user.entity';
import { Organization } from './app/entities/organization.entity';
import { Task } from './app/entities/task.entity';
import {
  Role,
  TaskStatus,
} from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';

async function seed() {
  console.log('🌱 Starting seed...');

  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const orgRepo = app.get<Repository<Organization>>(
    getRepositoryToken(Organization)
  );
  const taskRepo = app.get<Repository<Task>>(getRepositoryToken(Task));

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await taskRepo.clear();
  await userRepo.clear();
  await orgRepo.clear();

  // Create organizations (2-level hierarchy)
  console.log('🏢 Creating organizations...');
  const parentOrg = orgRepo.create({
    name: 'Acme Corporation',
  });
  await orgRepo.save(parentOrg);

  const childOrg = orgRepo.create({
    name: 'Acme Engineering',
    parentId: parentOrg.id,
  });
  await orgRepo.save(childOrg);

  // Create users with different roles
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const owner = userRepo.create({
    email: 'owner@turbovets.com',
    password: hashedPassword,
    role: Role.OWNER,
    organizationId: parentOrg.id,
  });
  await userRepo.save(owner);

  const admin = userRepo.create({
    email: 'admin@turbovets.com',
    password: hashedPassword,
    role: Role.ADMIN,
    organizationId: childOrg.id,
  });
  await userRepo.save(admin);

  const viewer = userRepo.create({
    email: 'viewer@turbovets.com',
    password: hashedPassword,
    role: Role.VIEWER,
    organizationId: childOrg.id,
  });
  await userRepo.save(viewer);

  // Create sample tasks
  console.log('📋 Creating tasks...');
  const tasks = [
    {
      title: 'Review Q4 Budget',
      description: 'Analyze budget allocations for Q4 and prepare report',
      status: TaskStatus.TODO,
      category: 'Work',
      organizationId: parentOrg.id,
      createdById: owner.id,
    },
    {
      title: 'Update API Documentation',
      description: 'Document new authentication endpoints and RBAC logic',
      status: TaskStatus.IN_PROGRESS,
      category: 'Work',
      organizationId: childOrg.id,
      createdById: admin.id,
    },
    {
      title: 'Fix Login Bug',
      description: 'Users reporting login issues on mobile devices',
      status: TaskStatus.TODO,
      category: 'Work',
      organizationId: childOrg.id,
      createdById: viewer.id,
    },
    {
      title: 'Team Building Event',
      description: 'Organize quarterly team building activity',
      status: TaskStatus.DONE,
      category: 'Personal',
      organizationId: parentOrg.id,
      createdById: owner.id,
    },
  ];

  for (const taskData of tasks) {
    const task = taskRepo.create(taskData);
    await taskRepo.save(task);
  }

  console.log('\n✅ Seed data created successfully!\n');
  console.log('📧 Test Credentials:');
  console.log('Owner:  owner@turbovets.com  / password123');
  console.log('Admin:  admin@turbovets.com  / password123');
  console.log('Viewer: viewer@turbovets.com / password123\n');
  console.log('🏢 Organizations:');
  console.log(`Parent: ${parentOrg.name} (${parentOrg.id})`);
  console.log(`Child:  ${childOrg.name} (${childOrg.id})\n`);

  await app.close();
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
