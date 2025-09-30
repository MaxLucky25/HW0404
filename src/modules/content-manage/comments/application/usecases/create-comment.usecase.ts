import { CreateCommentInputDto } from '../../api/input-dto/create-comment.input.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { PostRepository } from '../../../posts/infrastructure/postRepository';
import { CommentLikesDomainService } from '../../domain/services/comment-likes.domain-service';
import { UsersRepository } from '../../../../auth-manage/user-accounts/infrastructure/user.repository';

export class CreateCommentCommand {
  constructor(
    public readonly dto: CreateCommentInputDto,
    public readonly postId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand, CommentViewDto>
{
  constructor(
    private commentRepository: CommentRepository,
    private postRepository: PostRepository,
    private commentLikesDomainService: CommentLikesDomainService,
    private userRepository: UsersRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<CommentViewDto> {
    // Проверяем, что пост существует
    await this.postRepository.findOrNotFoundFail({
      id: command.postId,
    });

    // Получаем пользователя для получения login
    const user = await this.userRepository.findOrNotFoundFail({
      id: command.userId,
    });

    const comment = await this.commentRepository.createComment({
      content: command.dto.content,
      postId: command.postId,
      commentatorId: command.userId,
      commentatorLogin: user.login,
    });

    // Создаем пустую информацию о лайках для нового комментария
    const likesInfo = this.commentLikesDomainService.createEmptyLikesInfo();

    return CommentViewDto.mapToView(comment, likesInfo);
  }
}
