import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import {
  FindByConfirmationCodeDto,
  FindByEmailDto,
  FindByIdDto,
  FindByLoginOrEmailDto,
  FindByRecoveryDto,
} from './dto/repoDto';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async findById(dto: FindByIdDto): Promise<UserDocument | null> {
    return this.UserModel.findOne({ _id: dto.id, deletedAt: null });
  }

  async findOrNotFoundFail(dto: FindByIdDto): Promise<UserDocument> {
    const user = await this.findById(dto);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found!',
        field: 'User',
      });
    }

    return user;
  }

  async findByEmail(dto: FindByEmailDto): Promise<UserDocument | null> {
    return this.UserModel.findOne({ email: dto.email, deletedAt: null });
  }

  async findByLoginOrEmail(
    dto: FindByLoginOrEmailDto,
  ): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      $or: [{ login: dto.loginOrEmail }, { email: dto.loginOrEmail }],
      deletedAt: null,
    });
  }

  async findByRecoveryCode(
    dto: FindByRecoveryDto,
  ): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'passwordRecovery.recoveryCode': dto.recoveryCode,
      deletedAt: null,
    });
  }

  async findByConfirmationCode(
    dto: FindByConfirmationCodeDto,
  ): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'emailConfirmation.confirmationCode': dto.confirmationCode,
      deletedAt: null,
    });
  }

  async createUser(dto: CreateUserDomainDto): Promise<UserDocument> {
    const user = this.UserModel.createUser(dto);
    await user.save();
    return user;
  }

  async save(user: UserDocument) {
    await user.save();
  }
}
