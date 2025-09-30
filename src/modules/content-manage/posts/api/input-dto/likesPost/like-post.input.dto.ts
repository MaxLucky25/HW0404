import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../../domain/dto/likesPost/like-status.enum';

export class LikePostInputDto {
  @ApiProperty({
    description: 'Send None if you want to unlike\\undislike',
    enum: LikeStatus,
    example: LikeStatus.Like,
  })
  @IsEnum(LikeStatus, {
    message: 'likeStatus must be one of: None, Like, Dislike',
  })
  likeStatus: LikeStatus;
}
