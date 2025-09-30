import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UpdateUserInputDto {
  @ApiProperty({ example: 'user@mail.com', description: 'Email' })
  @IsEmail()
  email: string;
}
