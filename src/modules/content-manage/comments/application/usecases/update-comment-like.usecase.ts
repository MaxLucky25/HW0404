import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeCommentInputDto } from '../../api/input-dto/like-comment.input.dto';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { CommentLikeRepository } from '../../infrastructure/comment-like.repository';
import { UsersRepository } from '../../../../auth-manage/user-accounts/infrastructure/user.repository';

export class UpdateCommentLikeCommand {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
    public readonly dto: LikeCommentInputDto,
  ) {}
}

@CommandHandler(UpdateCommentLikeCommand)
export class UpdateCommentLikeUseCase
  implements ICommandHandler<UpdateCommentLikeCommand, void>
{
  constructor(
    private commentLikeRepository: CommentLikeRepository,
    private commentRepository: CommentRepository,
    private userRepository: UsersRepository,
  ) {}

  async execute(command: UpdateCommentLikeCommand): Promise<void> {
    // Проверяем, что комментарий существует
    await this.commentRepository.findOrNotFoundFail({
      id: command.commentId,
    });

    // Получаем пользователя для получения login
    const user = await this.userRepository.findOrNotFoundFail({
      id: command.userId,
    });

    const existingLike = await this.commentLikeRepository.findById({
      userId: command.userId,
      commentId: command.commentId,
    });

    if (existingLike) {
      // Обновляем существующий лайк
      await this.commentLikeRepository.updateLikeStatus({
        userId: command.userId,
        commentId: command.commentId,
        newStatus: command.dto.likeStatus,
      });
    } else {
      // Создаем новый лайк
      await this.commentLikeRepository.createCommentLike({
        userId: command.userId,
        userLogin: user.login,
        commentId: command.commentId,
        status: command.dto.likeStatus,
      });
    }
  }
}
