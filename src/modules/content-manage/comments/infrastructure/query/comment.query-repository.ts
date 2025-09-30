import { CommentViewDto } from '../../api/view-dto/comment.view-dto';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { sortDirectionToNumber } from '../../../../../core/dto/base.query-params.input-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { Injectable } from '@nestjs/common';
import {
  CommentLike,
  CommentLikeModelType,
} from '../../domain/comment-like.entity';
import { CommentLikesDomainService } from '../../domain/services/comment-likes.domain-service';

@Injectable()
export class CommentQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    @InjectModel(CommentLike.name)
    private commentLikeModel: CommentLikeModelType,
    private commentLikesDomainService: CommentLikesDomainService,
  ) {}

  async getByIdNotFoundFail(
    id: string,
    userId?: string,
  ): Promise<CommentViewDto> {
    const comment = await this.CommentModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
        field: 'Comment',
      });
    }

    // Получаем актуальную информацию о лайках через domain service
    const likesInfo = await this.commentLikesDomainService.getLikesInfo(
      id,
      this.commentLikeModel,
      userId,
    );

    return CommentViewDto.mapToView(comment, likesInfo);
  }

  async getCommentsForPost(
    postId: string,
    query: GetCommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const filter: FilterQuery<Comment> = {
      postId,
      deletedAt: null,
    };

    const totalCount = await this.CommentModel.countDocuments(filter);

    const sortDirection = sortDirectionToNumber(query.sortDirection);
    const sortField = query.sortBy || 'createdAt';

    const comments = await this.CommentModel.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip((query.pageNumber - 1) * query.pageSize)
      .limit(query.pageSize)
      .exec();

    // Получаем информацию о лайках для каждого комментария
    const commentsWithLikes = await Promise.all(
      comments.map(async (comment) => {
        const likesInfo = await this.commentLikesDomainService.getLikesInfo(
          comment._id.toString(),
          this.commentLikeModel,
          userId,
        );
        return CommentViewDto.mapToView(comment, likesInfo);
      }),
    );

    const pagesCount = Math.ceil(totalCount / query.pageSize);

    return {
      pagesCount,
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount,
      items: commentsWithLikes,
    };
  }
}
