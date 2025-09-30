import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostViewDto } from '../../api/view-dto/post.view-dto';
import { PostQueryRepository } from '../../infrastructure/query/post.query-repository';

export class GetPostByIdQuery {
  constructor(
    public readonly id: string,
    public readonly userId?: string,
  ) {}
}

@QueryHandler(GetPostByIdQuery)
export class GetPostByIdUseCase
  implements IQueryHandler<GetPostByIdQuery, PostViewDto>
{
  constructor(private postQueryRepository: PostQueryRepository) {}

  async execute(query: GetPostByIdQuery): Promise<PostViewDto> {
    return this.postQueryRepository.getByIdNotFoundFail(query.id, query.userId);
  }
}
