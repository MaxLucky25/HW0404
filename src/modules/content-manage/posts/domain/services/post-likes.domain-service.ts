import { Injectable } from '@nestjs/common';
import { ExtendedLikesInfoViewDto } from '../../api/view-dto/likesPost/extended-likes-info.view-dto';
import { LikeStatus } from '../dto/likesPost/like-status.enum';
import { PostLikeModelType } from '../post-like.entity';

@Injectable()
export class PostLikesDomainService {
  /**
   * Получает расширенную информацию о лайках поста
   */
  async getExtendedLikesInfo(
    postId: string,
    postLikeModel: PostLikeModelType,
    userId?: string,
  ): Promise<ExtendedLikesInfoViewDto> {
    const [likesCount, dislikesCount, userReaction, newestLikes] =
      await Promise.all([
        postLikeModel.countDocuments({ postId, status: LikeStatus.Like }),
        postLikeModel.countDocuments({ postId, status: LikeStatus.Dislike }),
        userId ? postLikeModel.findOne({ userId, postId }) : null,
        postLikeModel
          .find({ postId, status: LikeStatus.Like })
          .sort({ addedAt: -1 })
          .limit(3)
          .exec(),
      ]);

    const myStatus = userReaction ? userReaction.status : LikeStatus.None;
    const newestLikesDetails = newestLikes.map((like) => ({
      addedAt: like.addedAt.toISOString(),
      userId: like.userId,
      login: like.userLogin,
    }));

    return {
      likesCount,
      dislikesCount,
      myStatus,
      newestLikes: newestLikesDetails,
    };
  }

  /**
   * Создает пустую информацию о лайках для нового поста
   */
  createEmptyLikesInfo(): ExtendedLikesInfoViewDto {
    return {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [],
    };
  }
}
