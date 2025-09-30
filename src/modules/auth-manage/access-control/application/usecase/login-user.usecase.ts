import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { LoginInputDto } from '../../api/input-dto/login.input.dto';
import { LoginResponseDto } from '../../api/view-dto/login.view-dto';

export class LoginUserCommand {
  constructor(public readonly dto: LoginInputDto) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase
  implements ICommandHandler<LoginUserCommand, LoginResponseDto>
{
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginResponseDto> {
    const userContext = await this.authService.validateUser(command.dto);
    const accessToken = this.jwtService.sign(userContext);

    // Refresh token теперь устанавливается в LocalStrategy
    return { accessToken };
  }
}
