import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../../user-accounts/infrastructure/user.repository';
import { MeViewDto } from '../../../user-accounts/api/view-dto/users.view-dto';
import { UserContextDto } from '../../../guards/dto/user-context.dto';

@Injectable()
export class AuthQueryRepository {
  constructor(private usersRepository: UsersRepository) {}

  async me(userId: UserContextDto): Promise<MeViewDto> {
    const user = await this.usersRepository.findOrNotFoundFail(userId);
    return MeViewDto.mapToView(user);
  }
}
