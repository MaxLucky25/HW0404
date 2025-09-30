import { IsEnum } from 'class-validator';
import { LikeStatus } from '../../domain/dto/comment-like.domain.dto';

export class LikeCommentInputDto {
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
