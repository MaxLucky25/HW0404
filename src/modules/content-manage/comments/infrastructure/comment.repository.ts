import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import {
  CreateCommentDomainDto,
  FindCommentByIdDto,
} from '../domain/dto/comment.domain.dto';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
  ) {}

  async findById(dto: FindCommentByIdDto): Promise<CommentDocument | null> {
    return this.CommentModel.findOne({ _id: dto.id, deletedAt: null });
  }

  async findOrNotFoundFail(id: FindCommentByIdDto): Promise<CommentDocument> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
        field: 'Comment',
      });
    }

    return comment;
  }

  async createComment(dto: CreateCommentDomainDto): Promise<CommentDocument> {
    const comment = this.CommentModel.createComment(dto);
    await comment.save();
    return comment;
  }

  async save(comment: CommentDocument) {
    await comment.save();
  }

  async updateComment(
    id: string,
    dto: { content: string },
  ): Promise<CommentDocument> {
    const comment = await this.findOrNotFoundFail({ id });
    comment.updateComment(dto);
    await this.save(comment);
    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    const comment = await this.findOrNotFoundFail({ id });
    comment.makeDelete();
    await this.save(comment);
  }
}
