import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateSessionDomainDto } from './dto/create-session.domain.dto';

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: String, required: true })
  token: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  deviceId: string;

  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: String, required: true })
  userAgent: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  lastActiveDate: Date;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Boolean, required: true, default: false })
  isRevoked: boolean;

  static createSession(dto: CreateSessionDomainDto): SessionDocument {
    const session = new this();
    session.token = dto.token;
    session.userId = dto.userId;
    session.deviceId = dto.deviceId;
    session.ip = dto.ip;
    session.userAgent = dto.userAgent;
    session.title = dto.title;
    session.createdAt = new Date();
    session.lastActiveDate = new Date();
    session.expiresAt = new Date(Date.now() + dto.expiresIn);
    session.isRevoked = false;

    return session as SessionDocument;
  }

  updateLastActiveDate() {
    this.lastActiveDate = new Date();
  }

  updateToken(newToken: string) {
    this.token = newToken;
  }

  updateExpiresAt(expiresIn: number) {
    this.expiresAt = new Date(Date.now() + expiresIn);
  }

  revoke() {
    this.isRevoked = true;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isActive(): boolean {
    return !this.isRevoked && !this.isExpired();
  }
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.loadClass(Session);

export type SessionDocument = HydratedDocument<Session>;

export type SessionModelType = Model<SessionDocument> & typeof Session;
