import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentLike,
  CommentLikeDocument,
  CommentLikeModelType,
} from '../domain/comment-like.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import {
  CreateCommentLikeDomainDto,
  FindCommentLikeDto,
  UpdateCommentLikeStatusDto,
} from '../domain/dto/comment-like.domain.dto';

@Injectable()
export class CommentLikeRepository {
  constructor(
    @InjectModel(CommentLike.name)
    private CommentLikeModel: CommentLikeModelType,
  ) {}

  async findById(dto: FindCommentLikeDto): Promise<CommentLikeDocument | null> {
    return this.CommentLikeModel.findOne({
      userId: dto.userId,
      commentId: dto.commentId,
    });
  }

  async findOrNotFoundFail(
    dto: FindCommentLikeDto,
  ): Promise<CommentLikeDocument> {
    const commentLike = await this.findById(dto);
    if (!commentLike) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment like not found',
        field: 'CommentLike',
      });
    }

    return commentLike;
  }

  async createCommentLike(
    dto: CreateCommentLikeDomainDto,
  ): Promise<CommentLikeDocument> {
    const commentLike = this.CommentLikeModel.createCommentLike(dto);
    await commentLike.save();
    return commentLike;
  }

  async save(commentLike: CommentLikeDocument) {
    await commentLike.save();
  }

  async updateLikeStatus(
    dto: UpdateCommentLikeStatusDto,
  ): Promise<CommentLikeDocument> {
    const commentLike = await this.findOrNotFoundFail({
      userId: dto.userId,
      commentId: dto.commentId,
    });

    commentLike.updateStatus(dto.newStatus);
    await this.save(commentLike);

    return commentLike;
  }
}
