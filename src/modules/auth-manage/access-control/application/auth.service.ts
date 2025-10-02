import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../user-accounts/infrastructure/user.repository';
import { UserContextDto } from '../../guards/dto/user-context.dto';
import { BcryptService } from './helping-application/bcrypt.service';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { LoginInputDto } from '../api/input-dto/login.input.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private bcryptService: BcryptService,
    private configService: ConfigService,
  ) {}

  getExpiration(key: string): number {
    const value = this.configService.get<number>(key);
    if (value === undefined) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: `Config value for ${key} is not set`,
        field: 'ConfigValue',
      });
    }
    return value;
  }

  isCodeValid(entity: { isConfirmed: boolean; expirationDate: Date }): boolean {
    const now = new Date();
    return !entity.isConfirmed && entity.expirationDate > now;
  }

  async validateUser(dto: LoginInputDto): Promise<UserContextDto> {
    const user = await this.usersRepository.findByLoginOrEmail({
      loginOrEmail: dto.loginOrEmail,
    });
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid credentials',
        field: 'loginOrEmail',
      });
    }

    const isPasswordValid = await this.bcryptService.compare({
      password: dto.password,
      hash: user.passwordHash,
    });

    if (!isPasswordValid) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid credentials',
        field: 'Password',
      });
    }

    return { id: user._id.toString() };
  }

  /**
   * Проверяет, являются ли два User-Agent строками одного браузера
   * @param ua1 - первый User-Agent
   * @param ua2 - второй User-Agent
   * @returns true, если браузеры одинаковые
   */
  isSameBrowser(ua1: string, ua2: string): boolean {
    const browser1 = this.extractBrowserName(ua1);
    const browser2 = this.extractBrowserName(ua2);
    return browser1 === browser2;
  }

  /**
   * Извлекает название браузера из User-Agent строки
   * @param userAgent - User-Agent строка
   * @returns название браузера
   */
  private extractBrowserName(userAgent: string): string {
    // Проверяем Edge первым, так как он содержит Chrome
    if (userAgent.includes('Edg')) return 'Edge';
    // Проверяем Opera
    if (userAgent.includes('OPR') || userAgent.includes('Opera'))
      return 'Opera';
    // Проверяем Firefox
    if (userAgent.includes('Firefox')) return 'Firefox';
    // Проверяем Chrome (но не Edge и не Opera)
    if (
      userAgent.includes('Chrome') &&
      !userAgent.includes('Edg') &&
      !userAgent.includes('OPR')
    )
      return 'Chrome';
    // Проверяем Safari (но не Chrome)
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
      return 'Safari';
    return 'Unknown';
  }
}
