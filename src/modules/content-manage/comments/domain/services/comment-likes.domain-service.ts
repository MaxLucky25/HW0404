import { Injectable } from '@nestjs/common';
import { LikeStatus } from '../dto/comment-like.domain.dto';
import { CommentLikeModelType } from '../comment-like.entity';

export interface CommentLikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
}

@Injectable()
export class CommentLikesDomainService {
  /**
   * Получает информацию о лайках комментария
   */
  async getLikesInfo(
    commentId: string,
    commentLikeModel: CommentLikeModelType,
    userId?: string,
  ): Promise<CommentLikesInfo> {
    const [likesCount, dislikesCount, userReaction] = await Promise.all([
      commentLikeModel.countDocuments({ commentId, status: LikeStatus.Like }),
      commentLikeModel.countDocuments({
        commentId,
        status: LikeStatus.Dislike,
      }),
      userId ? commentLikeModel.findOne({ userId, commentId }) : null,
    ]);

    const myStatus = userReaction ? userReaction.status : LikeStatus.None;

    return {
      likesCount,
      dislikesCount,
      myStatus,
    };
  }

  /**
   * Создает пустую информацию о лайках для нового комментария
   */
  createEmptyLikesInfo(): CommentLikesInfo {
    return {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
    };
  }
}
