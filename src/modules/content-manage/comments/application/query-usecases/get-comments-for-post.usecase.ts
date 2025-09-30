import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CommentQueryRepository } from '../../infrastructure/query/comment.query-repository';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';

export class GetCommentsForPostQuery {
  constructor(
    public readonly postId: string,
    public readonly query: GetCommentsQueryParams,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetCommentsForPostQuery)
export class GetCommentsForPostUseCase
  implements
    IQueryHandler<GetCommentsForPostQuery, PaginatedViewDto<CommentViewDto[]>>
{
  constructor(private commentQueryRepository: CommentQueryRepository) {}

  async execute(
    query: GetCommentsForPostQuery,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    return this.commentQueryRepository.getCommentsForPost(
      query.postId,
      query.query,
      query.userId,
    );
  }
}
