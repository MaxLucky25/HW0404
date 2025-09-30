import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/user.repository';

// модуль для инжекта в пост лайк для получения логина в последних лайках

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UserPersistenceModule {}
