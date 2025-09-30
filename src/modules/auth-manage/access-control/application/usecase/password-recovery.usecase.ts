import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PasswordRecoveryInputDto } from '../../api/input-dto/password-recovery.input.dto';
import { AuthService } from '../auth.service';
import { EmailService } from '../helping-application/email.service';
import { UsersRepository } from '../../../user-accounts/infrastructure/user.repository';

export class PasswordRecoveryCommand {
  constructor(public readonly dto: PasswordRecoveryInputDto) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand, void>
{
  constructor(
    private usersRepository: UsersRepository,
    private authService: AuthService,
    private emailService: EmailService,
  ) {}

  async execute(command: PasswordRecoveryCommand): Promise<void> {
    const user = await this.usersRepository.findByEmail({
      email: command.dto.email,
    });
    if (user) {
      const expiration = this.authService.getExpiration(
        'PASSWORD_RECOVERY_EXPIRATION',
      );
      user.resetPasswordRecovery(expiration);
      await this.usersRepository.save(user);
      await this.emailService.sendRecoveryEmail(
        user.email,
        user.passwordRecovery!.recoveryCode,
      );
    }
    return;
  }
}
