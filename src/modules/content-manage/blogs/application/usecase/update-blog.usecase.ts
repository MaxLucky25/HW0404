import { UpdateBlogInputDto } from '../../api/input-dto/update-blog.input.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogRepository } from '../../infrastructure/blog.repository';
import { FindByIdDto } from '../../domain/dto/blog.domain.dto';

export class UpdateBlogCommand {
  constructor(
    public readonly blogId: FindByIdDto,
    public readonly dto: UpdateBlogInputDto,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase
  implements ICommandHandler<UpdateBlogCommand, void>
{
  constructor(private blogRepository: BlogRepository) {}

  async execute(command: UpdateBlogCommand): Promise<void> {
    const blog = await this.blogRepository.findOrNotFoundFail({
      id: command.blogId.id,
    });

    blog.update(command.dto);

    await this.blogRepository.save(blog);
  }
}
