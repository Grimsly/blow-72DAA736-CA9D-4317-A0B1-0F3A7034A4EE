import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      // Preferably I would like to use Postgres, but SQLite is faster to bootstrap
      type: 'sqlite',
      database: process.env.DATABASE_PATH || 'data.db',
      entities: [User, Organization, Task],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    TasksModule,
  ],
})
export class AppModule {}
