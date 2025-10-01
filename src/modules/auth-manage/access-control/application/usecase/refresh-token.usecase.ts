import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { Response } from 'express';
import { LoginResponseDto } from '../../api/view-dto/login.view-dto';
import { TokenContextDto } from '../../../guards/dto/token-context.dto';
import { SecurityDeviceRepository } from '../../../security-device/infrastructure/security-device.repository';
import { FindByUserAndDeviceDto } from '../../../security-device/infrastructure/dto/session-repo.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { AuthService } from '../auth.service';
import { RefreshTokenService } from '../helping-application/refresh-token.service';

export class RefreshTokenCommand {
  constructor(
    public readonly user: TokenContextDto,
    public readonly response: Response,
  ) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase
  implements ICommandHandler<RefreshTokenCommand, LoginResponseDto>
{
  constructor(
    @Inject('ACCESS_JWT_SERVICE') private jwtService: JwtService,
    private securityDeviceRepository: SecurityDeviceRepository,
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<LoginResponseDto> {
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

    // Дополнительная проверка: получаем токен из cookie и сравниваем с токеном в сессии
    // Это обеспечивает, что старый токен станет невалидным после refresh
    const refreshTokenFromCookie = command.response.req.cookies?.refreshToken;
    if (!refreshTokenFromCookie || refreshTokenFromCookie !== session.token) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid or expired refresh token',
        field: 'refreshToken',
      });
    }

    // Генерируем новые токены
    const newRefreshToken = this.refreshTokenService.generateRefreshToken(
      user.userId,
      session.deviceId, // Используем deviceId из сессии, а не из стратегии
    );

    const newAccessToken = this.jwtService.sign({
      id: user.userId,
    });

    // Получаем новый срок жизни refresh token
    const refreshTokenExpiresIn = this.authService.getExpiration(
      'JWT_REFRESH_EXPIRES_IN',
    );

    // REFRESH TOKEN ROTATION: Обновляем сессию новым токеном и lastActiveDate
    session.updateToken(newRefreshToken);
    session.updateLastActiveDate();
    session.updateExpiresAt(refreshTokenExpiresIn);
    await this.securityDeviceRepository.save(session);

    // Устанавливаем новый refresh token в cookie
    this.refreshTokenService.setRefreshTokenCookie(response, newRefreshToken);

    return { accessToken: newAccessToken };
  }
}
