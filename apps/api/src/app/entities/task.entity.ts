import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'text', default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ nullable: true })
  category: string;

  @Column()
  organizationId: string;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Organization)
  organization: Organization;

  @ManyToOne(() => User)
  createdBy: User;
}
