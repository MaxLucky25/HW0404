import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { AuthService } from '../../access-control/application/auth.service';
import { RefreshTokenService } from '../../access-control/application/helping-application/refresh-token.service';
import { UserContextDto } from '../dto/user-context.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
  ) {
    super({
      usernameField: 'loginOrEmail',
      passReqToCallback: true, // Включаем передачу request в callback
    });
  }

  async validate(
    req: Request,
    username: string,
    password: string,
  ): Promise<UserContextDto> {
    const user = await this.authService.validateUser({
      loginOrEmail: username,
      password,
    });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid username or password',
        field: 'username',
      });
    }

    // Устанавливаем refresh token в cookie прямо здесь!
    const refreshToken = this.refreshTokenService.generateRefreshToken(user.id);
    if (req.res) {
      this.refreshTokenService.setRefreshTokenCookie(req.res, refreshToken);
    }

    return user;
  }
}
