import { CommentDocument } from '../../domain/comment.entity';
import { CommentLikesInfo } from '../../domain/services/comment-likes.domain-service';

export class CommentatorInfoViewDto {
  userId: string;
  userLogin: string;
}

export class LikesInfoViewDto {
  likesCount: number;
  dislikesCount: number;
  myStatus: string;
}

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfoViewDto;
  createdAt: string;
  likesInfo: LikesInfoViewDto;

  static mapToView(
    comment: CommentDocument,
    likesInfo: CommentLikesInfo,
  ): CommentViewDto {
    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorId,
        userLogin: comment.commentatorLogin,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: likesInfo.likesCount,
        dislikesCount: likesInfo.dislikesCount,
        myStatus: likesInfo.myStatus,
      },
    };
  }
}
