import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersController } from './api/user.controller';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { UsersRepository } from './infrastructure/user.repository';
import { HelpingApplicationModule } from '../access-control/application/helping-application/helping-application.module';
import { UserFactory } from './application/user.factory';
import { CqrsModule } from '@nestjs/cqrs';
import { GetAllUsersQueryUseCase } from './application/query-usecase/get-all-users.usecase';
import { GetUserByIdUseCase } from './application/query-usecase/get-user-by-id.usecase';
import { CreateUserUseCase } from './application/usecase/create-user.usecase';
import { UpdateUserUseCase } from './application/usecase/update-user.usecase';
import { DeleteUserUseCase } from './application/usecase/delete-user.usecase';

const QueryHandler = [GetAllUsersQueryUseCase, GetUserByIdUseCase];

const CommandHandler = [
  CreateUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
];
@Module({
  imports: [
    CqrsModule,
    HelpingApplicationModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    ...CommandHandler,
    ...QueryHandler,
    UsersQueryRepository,
    UsersRepository,
    UserFactory,
  ],
  exports: [UsersRepository, UserFactory],
})
export class UsersAccountModule {}
