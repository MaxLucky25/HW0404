import { ApiProperty } from '@nestjs/swagger';
import { SessionDocument } from '../../domain/session.entity';

export class DeviceViewDto {
  @ApiProperty({
    description: 'Unique device identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  deviceId: string;

  @ApiProperty({
    description: 'Device title/name',
    example: 'Chrome Windows',
  })
  title: string;

  @ApiProperty({
    description: 'Device IP address',
    example: '192.168.1.100',
  })
  ip: string;

  @ApiProperty({
    description: 'Device user agent',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  userAgent: string;

  @ApiProperty({
    description: 'Last activity date',
    example: '2023-12-01T10:30:00.000Z',
  })
  lastActiveDate: string;

  static mapToView(session: SessionDocument): DeviceViewDto {
    return {
      deviceId: session.deviceId,
      title: session.title,
      ip: session.ip,
      userAgent: session.userAgent,
      lastActiveDate: session.lastActiveDate.toISOString(),
    };
  }
}
