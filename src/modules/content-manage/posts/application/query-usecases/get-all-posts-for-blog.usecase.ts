import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PostQueryRepository } from '../../infrastructure/query/post.query-repository';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../api/view-dto/post.view-dto';

export class GetAllPostsForBlogQuery {
  constructor(
    public readonly blogId: string,
    public readonly queryParams: GetPostsQueryParams,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetAllPostsForBlogQuery)
export class GetPostsForBlogUseCase
  implements
    IQueryHandler<GetAllPostsForBlogQuery, PaginatedViewDto<PostViewDto[]>>
{
  constructor(private postQueryRepository: PostQueryRepository) {}

  async execute(
    query: GetAllPostsForBlogQuery,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postQueryRepository.getAllPostForBlog(
      query.blogId,
      query.queryParams,
      query.userId,
    );
  }
}
