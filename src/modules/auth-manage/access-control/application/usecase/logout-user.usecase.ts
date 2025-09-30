import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Response } from 'express';
import { TokenContextDto } from '../../../guards/dto/token-context.dto';
import { SecurityDeviceRepository } from '../../../security-device/infrastructure/security-device.repository';
import { FindByUserAndDeviceDto } from '../../../security-device/infrastructure/dto/session-repo.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class LogoutUserCommand {
  constructor(
    public readonly user: TokenContextDto,
    public readonly response: Response,
  ) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUserUseCase
  implements ICommandHandler<LogoutUserCommand, void>
{
  constructor(private securityDeviceRepository: SecurityDeviceRepository) {}

  async execute(command: LogoutUserCommand): Promise<void> {
    const { user, response } = command;

    // Ищем сессию в БД по userId + deviceId
    const sessionDto: FindByUserAndDeviceDto = {
      userId: user.userId,
      deviceId: user.deviceId,
    };
    const session =
      await this.securityDeviceRepository.findByUserAndDevice(sessionDto);

    if (!session) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Session not found',
        field: 'refreshToken',
      });
    }

    // Проверяем, что сессия активна
    if (!session.isActive()) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Session is expired or revoked',
        field: 'refreshToken',
      });
    }

    // Отзываем сессию
    session.revoke();
    await this.securityDeviceRepository.save(session);

    // Очищаем refresh token cookie
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
}
