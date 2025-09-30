import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateCommentDomainDto } from './dto/comment.domain.dto';
import { UpdateCommentDomainDto } from './dto/comment.domain.dto';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: String, required: true })
  commentatorId: string;

  @Prop({ type: String, required: true })
  commentatorLogin: string;

  @Prop({ type: Date, default: new Date() })
  createdAt: Date;

  @Prop({ type: Date, required: false, default: null })
  deletedAt: Date | null;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  dislikesCount: number;

  static createComment(dto: CreateCommentDomainDto): CommentDocument {
    const comment = new this();
    comment.content = dto.content;
    comment.postId = dto.postId;
    comment.commentatorId = dto.commentatorId;
    comment.commentatorLogin = dto.commentatorLogin;
    comment.createdAt = new Date();

    return comment as CommentDocument;
  }

  makeDelete() {
    this.deletedAt = new Date();
  }

  updateComment(dto: UpdateCommentDomainDto) {
    this.content = dto.content;
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
