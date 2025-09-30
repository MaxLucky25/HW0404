import { PostDocument } from '../../domain/post.entity';
import { ExtendedLikesInfoViewDto } from './likesPost/extended-likes-info.view-dto';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoViewDto;

  static mapToView(
    post: PostDocument,
    extendedLikesInfo: ExtendedLikesInfoViewDto,
  ): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.createdAt = post.createdAt.toISOString();
    dto.extendedLikesInfo = extendedLikesInfo;

    return dto;
  }
}
