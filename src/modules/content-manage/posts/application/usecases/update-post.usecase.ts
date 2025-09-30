import { UpdatePostInputDto } from '../../api/input-dto/update-post.input.dto';
import { FindPostByIdDto } from '../../domain/dto/post.domain.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/postRepository';

export class UpdatePostCommand {
  constructor(
    public readonly id: FindPostByIdDto,
    public readonly dto: UpdatePostInputDto,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase
  implements ICommandHandler<UpdatePostCommand, void>
{
  constructor(private postRepository: PostRepository) {}

  async execute(command: UpdatePostCommand): Promise<void> {
    const post = await this.postRepository.findOrNotFoundFail(command.id);

    post.updatePost(command.dto);

    await this.postRepository.save(post);
  }
}
