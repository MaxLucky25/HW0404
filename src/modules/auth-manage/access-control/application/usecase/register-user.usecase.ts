import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserInputDto } from '../../../user-accounts/api/input-dto/users.input-dto';
import { UserFactory } from '../../../user-accounts/application/user.factory';
import { AuthService } from '../auth.service';
import { UsersRepository } from '../../../user-accounts/infrastructure/user.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { EmailService } from '../helping-application/email.service';

export class RegistrationUserCommand {
  constructor(public readonly dto: CreateUserInputDto) {}
}

@CommandHandler(RegistrationUserCommand)
export class RegistrationUserUseCase
  implements ICommandHandler<RegistrationUserCommand, void>
{
  constructor(
    private userFactory: UserFactory,
    private authService: AuthService,
    private usersRepository: UsersRepository,
    private emailService: EmailService,
  ) {}

  async execute(command: RegistrationUserCommand): Promise<void> {
    const createdUser = await this.userFactory.create(command.dto);

    const expiration = this.authService.getExpiration(
      'EMAIL_CONFIRMATION_EXPIRATION',
    );
    createdUser.resetEmailConfirmation(expiration);

    if (!createdUser.emailConfirmation) {
      throw new DomainException({
        code: DomainExceptionCode.EmailNotConfirmed,
        message: 'emailConfirmation is not set',
        field: 'email',
      });
    }

    await this.usersRepository.save(createdUser);

    this.emailService
      .sendConfirmationEmail(
        createdUser.email,
        createdUser.emailConfirmation.confirmationCode,
      )
      .catch(() => {
        // Логирование для удобства тестирования
        console.error('Email sending failed');
      });
  }
}
