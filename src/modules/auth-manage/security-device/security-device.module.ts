import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { Session, SessionSchema } from './domain/session.entity';
import { SecurityDeviceRepository } from './infrastructure/security-device.repository';
import { SecurityController } from './api/security.controller';
import { GetUserDevicesQueryUseCase } from './application/query-usecase/get-user-devices.usecase';
import { DeleteDeviceUseCase } from './application/usecase/delete-device.usecase';
import { DeleteAllDevicesUseCase } from './application/usecase/delete-all-devices.usecase';
import { RefreshTokenAuthGuard } from '../guards/bearer/refresh-token-auth.guard';

const QueryHandlers = [GetUserDevicesQueryUseCase];
const CommandHandlers = [DeleteDeviceUseCase, DeleteAllDevicesUseCase];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  controllers: [SecurityController],
  providers: [
    SecurityDeviceRepository,
    RefreshTokenAuthGuard,
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [SecurityDeviceRepository],
})
export class SecurityDeviceModule {}
