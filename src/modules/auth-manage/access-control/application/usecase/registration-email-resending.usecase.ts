import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationEmailResendingInputDto } from '../../api/input-dto/registration-email-resending.input.dto';
import { UsersRepository } from '../../../user-accounts/infrastructure/user.repository';
import { EmailService } from '../helping-application/email.service';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { AuthService } from '../auth.service';

export class RegistrationEmailResendingCommand {
  constructor(public readonly dto: RegistrationEmailResendingInputDto) {}
}

@CommandHandler(RegistrationEmailResendingCommand)
export class RegistrationEmailResendingUseCase
  implements ICommandHandler<RegistrationEmailResendingCommand, void>
{
  constructor(
    private usersRepository: UsersRepository,
    private emailService: EmailService,
    private authService: AuthService,
  ) {}

  async execute(command: RegistrationEmailResendingCommand): Promise<void> {
    const user = await this.usersRepository.findByEmail({
      email: command.dto.email,
    });
    if (!user || user.isEmailConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.AlreadyConfirmed,
        message: 'Email already confirmed',
        field: 'email',
      });
    }
    const expiration = this.authService.getExpiration(
      'EMAIL_CONFIRMATION_EXPIRATION',
    );
    user.resetEmailConfirmation(expiration);
    await this.usersRepository.save(user);
    await this.emailService.sendConfirmationEmail(
      user.email,
      user.emailConfirmation!.confirmationCode,
    );
    return;
  }
}
