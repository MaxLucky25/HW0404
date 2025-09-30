import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { UpdateUserInputDto } from '../api/input-dto/update-user.input.dto';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  login: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Boolean, required: true, default: false })
  isEmailConfirmed: boolean;

  @Prop({ type: Date, required: false, default: null })
  deletedAt: Date | null;

  @Prop({ type: Object, required: false })
  emailConfirmation?: {
    confirmationCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  };

  @Prop({ type: Object, required: false })
  passwordRecovery?: {
    recoveryCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  };

  static createUser(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;
    user.isEmailConfirmed = false;
    user.createdAt = new Date();

    return user as UserDocument;
  }

  makeDeleted() {
    this.deletedAt = new Date();
  }
  update(dto: UpdateUserInputDto) {
    if (dto.email !== this.email) {
      this.isEmailConfirmed = false;
    }
    this.email = dto.email;
  }

  resetEmailConfirmation(expirationMinutes: number) {
    this.emailConfirmation = {
      confirmationCode: randomUUID(),
      expirationDate: add(new Date(), { minutes: expirationMinutes }),
      isConfirmed: false,
    };
  }

  resetPasswordRecovery(expirationMinutes: number) {
    this.passwordRecovery = {
      recoveryCode: randomUUID(),
      expirationDate: add(new Date(), { minutes: expirationMinutes }),
      isConfirmed: false,
    };
  }
}
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
