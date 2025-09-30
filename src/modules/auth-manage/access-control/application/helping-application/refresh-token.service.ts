import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class RefreshTokenService {
  constructor(
    @Inject('REFRESH_JWT_SERVICE') private refreshJwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Генерирует refresh token для пользователя
   * @param userId - ID пользователя
   * @returns refresh token
   */
  generateRefreshToken(userId: string): string {
    return this.refreshJwtService.sign({ userId });
  }

  /**
   * Устанавливает refresh token в httpOnly cookie
   * @param res - Express Response объект
   * @param refreshToken - refresh token для установки
   */
  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const maxAge = this.getRefreshTokenMaxAge();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge,
    });
  }

  /**
   * Генерирует и устанавливает refresh token в cookie
   * @param res - Express Response объект
   * @param userId - ID пользователя
   * @returns refresh token
   */
  generateAndSetRefreshToken(res: Response, userId: string): string {
    const refreshToken = this.generateRefreshToken(userId);
    this.setRefreshTokenCookie(res, refreshToken);
    return refreshToken;
  }

  /**
   * Получает максимальное время жизни refresh token из конфигурации
   * @returns время жизни в миллисекундах
   */
  private getRefreshTokenMaxAge(): number {
    const expiresInMilliseconds = this.configService.get<number>(
      'JWT_REFRESH_EXPIRES_IN',
    );
    if (!expiresInMilliseconds) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'JWT_REFRESH_EXPIRES_IN is not configured',
        field: 'ConfigValue',
      });
    }
    return expiresInMilliseconds; // уже в миллисекундах
  }
}
