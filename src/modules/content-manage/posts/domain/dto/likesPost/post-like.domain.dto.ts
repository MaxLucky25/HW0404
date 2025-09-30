import { LikeStatus } from './like-status.enum';

export class CreatePostLikeDomainDto {
  userId: string;
  userLogin: string;
  postId: string;
  status: LikeStatus;
}

export class FindPostLikeDto {
  userId: string;
  postId: string;
}

export class UpdatePostLikeStatusDto {
  userId: string;
  postId: string;
  newStatus: LikeStatus;
}
