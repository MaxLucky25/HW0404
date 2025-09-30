import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/user.repository';
import { UserDocument } from '../domain/user.entity';
import { CreateUserInputDto } from '../api/input-dto/users.input-dto';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { BcryptService } from '../../access-control/application/helping-application/bcrypt.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Extension } from '../../../../core/exceptions/domain-exceptions';

@Injectable()
export class UserFactory {
  constructor(
    private readonly bcryptService: BcryptService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(dto: CreateUserInputDto): Promise<UserDocument> {
    const [byLogin, byEmail, passwordHash] = await Promise.all([
      this.usersRepository.findByLoginOrEmail({ loginOrEmail: dto.login }),
      this.usersRepository.findByLoginOrEmail({ loginOrEmail: dto.email }),
      this.bcryptService.generateHash({
        password: dto.password,
      }),
    ]);

    if (byLogin || byEmail) {
      const extensions: Extension[] = [];
      if (byLogin) {
        extensions.push(new Extension('Login already exists', 'login'));
      }
      if (byEmail) {
        extensions.push(new Extension('Email already exists', 'email'));
      }
      throw new DomainException({
        code: DomainExceptionCode.AlreadyExists,
        message: 'Login or Email already exists!',
        field: extensions.length === 1 ? extensions[0].key : '',
        extensions,
      });
    }

    const user: CreateUserDomainDto = {
      ...dto,
      passwordHash,
    };

    return this.usersRepository.createUser(user);
  }
}
