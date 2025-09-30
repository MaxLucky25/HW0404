import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { LikeStatus } from './dto/comment-like.domain.dto';
import { CreateCommentLikeDomainDto } from './dto/comment-like.domain.dto';

@Schema({ timestamps: true })
export class CommentLike {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  userLogin: string;

  @Prop({ type: String, required: true, index: true })
  commentId: string;

  @Prop({ type: String, enum: LikeStatus, required: true })
  status: LikeStatus;

  @Prop({ type: Date, default: new Date() })
  addedAt: Date;

  /**
   * Создает новый лайк комментария
   */
  static createCommentLike(
    dto: CreateCommentLikeDomainDto,
  ): CommentLikeDocument {
    const commentLike = new this();
    commentLike.userId = dto.userId;
    commentLike.userLogin = dto.userLogin;
    commentLike.commentId = dto.commentId;
    commentLike.status = dto.status;
    commentLike.addedAt = new Date();

    return commentLike as CommentLikeDocument;
  }

  /**
   * Обновляет статус лайка
   */
  updateStatus(newStatus: LikeStatus) {
    this.status = newStatus;
    this.addedAt = new Date();
  }
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);

// Составной уникальный индекс для предотвращения дублирования лайков
CommentLikeSchema.index({ userId: 1, commentId: 1 }, { unique: true });

// Индекс для быстрого поиска лайков по комментарию и статусу
CommentLikeSchema.index({ commentId: 1, status: 1 });

// Индекс для получения последних лайков
CommentLikeSchema.index({ commentId: 1, status: 1, addedAt: -1 });

CommentLikeSchema.loadClass(CommentLike);

export type CommentLikeDocument = HydratedDocument<CommentLike>;
export type CommentLikeModelType = Model<CommentLikeDocument> &
  typeof CommentLike;
