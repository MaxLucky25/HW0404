import { FindPostByIdDto } from '../../domain/dto/post.domain.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/postRepository';

export class DeletePostCommand {
  constructor(public readonly id: FindPostByIdDto) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase
  implements ICommandHandler<DeletePostCommand, void>
{
  constructor(private postRepository: PostRepository) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const post = await this.postRepository.findOrNotFoundFail(command.id);
    post.makeDelete();

    await this.postRepository.save(post);
  }
}
