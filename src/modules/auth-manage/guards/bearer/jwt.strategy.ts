import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserContextDto } from '../dto/user-context.dto';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'JWT_SECRET is not set in environment variables',
        field: 'Secret',
      });
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * функция принимает payload из jwt токена и возвращает то, что впоследствии будет записано в req.user
   * @param payload
   */
  validate(payload: UserContextDto): Promise<UserContextDto> {
    return Promise.resolve(payload);
  }
}
