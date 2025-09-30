import { Module } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { UsersAccountModule } from '../user-accounts/user-accounts.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from '../guards/local/local.strategy';
import { JwtStrategy } from '../guards/bearer/jwt.strategy';
import { HelpingApplicationModule } from './application/helping-application/helping-application.module';
import { CqrsModule } from '@nestjs/cqrs';
import { RegistrationUserUseCase } from './application/usecase/register-user.usecase';
import { LoginUserUseCase } from './application/usecase/login-user.usecase';
import { PasswordRecoveryUseCase } from './application/usecase/password-recovery.usecase';
import { NewPasswordUseCase } from './application/usecase/new-password.usecase';
import { RegistrationConfirmationUserUseCase } from './application/usecase/registration-confirmation.usecase';
import { RegistrationEmailResendingUseCase } from './application/usecase/registration-email-resending.usecase';
import { AuthMeQueryUseCase } from './application/query-usecase/auth-me.usecase';
import { RefreshTokenService } from './application/helping-application/refresh-token.service';

const CommandHandler = [
  RegistrationUserUseCase,
  LoginUserUseCase,
  PasswordRecoveryUseCase,
  NewPasswordUseCase,
  RegistrationConfirmationUserUseCase,
  RegistrationEmailResendingUseCase,
];

const QueryHandler = [AuthMeQueryUseCase];

@Module({
  imports: [
    CqrsModule,
    HelpingApplicationModule,
    UsersAccountModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    ...CommandHandler,
    ...QueryHandler,
    AuthService,
    AuthQueryRepository,
    LocalStrategy,
    JwtStrategy,
    RefreshTokenService,
    // Провайдер для refresh JWT сервиса
    {
      provide: 'REFRESH_JWT_SERVICE',
      useFactory: (configService: ConfigService) => {
        const jwtService = new JwtService({
          secret: configService.get<string>('JWT_REFRESH_SECRET'),
          signOptions: {
            expiresIn: configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
          },
        });
        return jwtService;
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, AuthQueryRepository, RefreshTokenService],
})
export class AccessModule {}
