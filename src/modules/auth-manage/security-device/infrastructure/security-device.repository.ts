import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/session.entity';
import { Injectable } from '@nestjs/common';
import {
  FindByUserIdDto,
  RevokeAllUserSessionsExceptCurrentDto,
  FindByUserAndDeviceDto,
} from './dto/session-repo.dto';
import { CreateSessionDomainDto } from '../domain/dto/create-session.domain.dto';

@Injectable()
export class SecurityDeviceRepository {
  constructor(
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
  ) {}

  // Основной метод для refresh flow - поиск по userId + deviceId
  async findByUserAndDevice(
    dto: FindByUserAndDeviceDto,
  ): Promise<SessionDocument | null> {
    return this.SessionModel.findOne({
      userId: dto.userId,
      deviceId: dto.deviceId,
      isRevoked: false,
    });
  }

  // Метод для поиска сессии только по deviceId (для проверки прав доступа)
  async findByDeviceId(deviceId: string): Promise<SessionDocument | null> {
    return this.SessionModel.findOne({
      deviceId,
      isRevoked: false,
    });
  }

  async findByUserId(dto: FindByUserIdDto): Promise<SessionDocument[]> {
    return this.SessionModel.find({
      userId: dto.userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() }, // Только не истекшие
    }).sort({ lastActiveDate: -1 });
  }

  async createSession(dto: CreateSessionDomainDto): Promise<SessionDocument> {
    const session = this.SessionModel.createSession(dto);
    await session.save();
    return session;
  }

  async save(session: SessionDocument) {
    await session.save();
  }

  // Обновленный метод - отзыв по userId + deviceId вместо токена
  async revokeSessionByUserAndDevice(
    dto: FindByUserAndDeviceDto,
  ): Promise<void> {
    const session = await this.SessionModel.findOne({
      userId: dto.userId,
      deviceId: dto.deviceId,
      isRevoked: false,
    });

    if (session) {
      session.revoke();
      await session.save();
    }
  }

  async revokeAllUserSessionsExceptCurrent(
    dto: RevokeAllUserSessionsExceptCurrentDto,
  ): Promise<void> {
    const sessions = await this.SessionModel.find({
      userId: dto.userId,
      isRevoked: false,
      deviceId: { $ne: dto.currentDeviceId },
    });

    for (const session of sessions) {
      session.revoke();
      await session.save();
    }
  }
}
