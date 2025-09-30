import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { LikeStatus } from './dto/likesPost/like-status.enum';
import { CreatePostLikeDomainDto } from './dto/likesPost/post-like.domain.dto';

@Schema({ timestamps: true })
export class PostLike {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  userLogin: string;

  @Prop({ type: String, required: true, index: true })
  postId: string;

  @Prop({ type: String, enum: LikeStatus, required: true })
  status: LikeStatus;

  @Prop({ type: Date, default: new Date() })
  addedAt: Date;

  /**
   * Создает новый лайк поста
   */
  static createPostLike(dto: CreatePostLikeDomainDto): PostLikeDocument {
    const postLike = new this();
    postLike.userId = dto.userId;
    postLike.userLogin = dto.userLogin;
    postLike.postId = dto.postId;
    postLike.status = dto.status;
    postLike.addedAt = new Date();

    return postLike as PostLikeDocument;
  }

  /**
   * Обновляет статус лайка
   */
  updateStatus(newStatus: LikeStatus) {
    this.status = newStatus;
    this.addedAt = new Date();
  }
}

export const PostLikeSchema = SchemaFactory.createForClass(PostLike);

// Составной уникальный индекс для предотвращения дублирования лайков
PostLikeSchema.index({ userId: 1, postId: 1 }, { unique: true });

// Индекс для быстрого поиска лайков по посту и статусу
PostLikeSchema.index({ postId: 1, status: 1 });

// Индекс для получения последних лайков
PostLikeSchema.index({ postId: 1, status: 1, addedAt: -1 });

PostLikeSchema.loadClass(PostLike);

export type PostLikeDocument = HydratedDocument<PostLike>;
export type PostLikeModelType = Model<PostLikeDocument> & typeof PostLike;
