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
    console.log(
      'RegistrationEmailResendingUseCase.execute called with:',
      command.dto,
    );

    const user = await this.usersRepository.findByEmail({
      email: command.dto.email,
    });

    console.log('User found:', {
      exists: !!user,
      isEmailConfirmed: user?.isEmailConfirmed,
      email: command.dto.email,
    });

    if (!user || user.isEmailConfirmed) {
      console.log('Throwing AlreadyConfirmed exception');
      throw new DomainException({
        code: DomainExceptionCode.AlreadyConfirmed,
        message: 'Email already confirmed',
        field: 'email',
      });
    }

    const expiration = this.authService.getExpiration(
      'EMAIL_CONFIRMATION_EXPIRATION',
    );
    console.log('Email confirmation expiration:', expiration);

    user.resetEmailConfirmation(expiration);
    await this.usersRepository.save(user);
    console.log('User saved with new confirmation code');

    // Отправляем email с обработкой ошибок
    console.log('Attempting to send confirmation email');
    await this.emailService
      .sendConfirmationEmail(
        user.email,
        user.emailConfirmation!.confirmationCode,
      )
      .then(() => {
        console.log('Email sent successfully');
      })
      .catch((error) => {
        console.log('Email sending failed (ignored):', error.message);
        // Не выбрасываем исключение, просто игнорируем ошибку
      });

    console.log(
      'RegistrationEmailResendingUseCase.execute completed successfully',
    );
    return;
  }
}
