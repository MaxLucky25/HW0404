import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationConfirmationInputDto } from '../../api/input-dto/registration-confirmation.input.dto';
import { UsersRepository } from '../../../user-accounts/infrastructure/user.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class RegistrationConfirmationCommand {
  constructor(public readonly dto: RegistrationConfirmationInputDto) {}
}

@CommandHandler(RegistrationConfirmationCommand)
export class RegistrationConfirmationUserUseCase
  implements ICommandHandler<RegistrationConfirmationCommand, void>
{
  constructor(private usersRepository: UsersRepository) {}

  async execute(command: RegistrationConfirmationCommand): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode({
      confirmationCode: command.dto.code,
    });

    // Проверяем, что пользователь и emailConfirmation существуют
    if (!user?.emailConfirmation) {
      throw new DomainException({
        code: DomainExceptionCode.ConfirmationCodeInvalid,
        message: 'Confirmation code is not valid',
        field: 'code',
      });
    }

    // Проверяем, что пользователь уже подтвержден
    if (user.isEmailConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.ConfirmationCodeInvalid,
        message: 'Confirmation code is not valid',
        field: 'code',
      });
    }

    // Проверяем, что код уже подтвержден
    if (user.emailConfirmation.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.ConfirmationCodeInvalid,
        message: 'Confirmation code is not valid',
        field: 'code',
      });
    }

    // Проверяем, что код не истек
    if (user.emailConfirmation.expirationDate <= new Date()) {
      throw new DomainException({
        code: DomainExceptionCode.ConfirmationCodeInvalid,
        message: 'Confirmation code is not valid',
        field: 'code',
      });
    }

    user.isEmailConfirmed = true;
    user.emailConfirmation.isConfirmed = true;
    await this.usersRepository.save(user);
    return;
  }
}
