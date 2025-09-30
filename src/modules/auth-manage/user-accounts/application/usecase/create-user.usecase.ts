import { CreateUserInputDto } from '../../api/input-dto/users.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserViewDto } from '../../api/view-dto/users.view-dto';
import { UserFactory } from '../user.factory';

export class CreateUserCommand {
  constructor(public readonly dto: CreateUserInputDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, UserViewDto>
{
  constructor(private userFactory: UserFactory) {}

  async execute(command: CreateUserCommand): Promise<UserViewDto> {
    const user = await this.userFactory.create(command.dto);
    return UserViewDto.mapToView(user);
  }
}
