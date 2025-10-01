import { Injectable, Inject } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { TokenContextDto } from '../dto/token-context.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

interface JwtServiceWithOptions {
  options: {
    secret: string;
  };
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh',
) {
  constructor(@Inject('REFRESH_JWT_SERVICE') jwtService: JwtService) {
    // Получаем secret из настроенного JWT сервиса
    const jwtServiceWithOptions =
      jwtService as unknown as JwtServiceWithOptions;
    const secret = jwtServiceWithOptions.options.secret;

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          return (req.cookies?.refreshToken as string | undefined) ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Валидирует refresh token
   * @param payload - payload из JWT
   * @returns TokenContextDto
   */
  validate(payload: { userId: string; deviceId?: string }): TokenContextDto {
    if (!payload.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid refresh token payload',
        field: 'refreshToken',
      });
    }

    return {
      userId: payload.userId,
      deviceId: payload.deviceId || 'legacy-device', // Fallback для старых токенов
    };
  }
}
