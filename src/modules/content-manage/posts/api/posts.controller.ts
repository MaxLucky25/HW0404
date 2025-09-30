import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { PostViewDto } from './view-dto/post.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UpdatePostInputDto } from './input-dto/update-post.input.dto';
import { CreatePostInputDto } from './input-dto/create-post.input.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '../application/usecases/create-post.usecase';
import { UpdatePostCommand } from '../application/usecases/update-post.usecase';
import { DeletePostCommand } from '../application/usecases/delete-post.usecase';
import { GetPostByIdQuery } from '../application/query-usecases/get-post-by-id.usecase';
import { GetAllPostsQuery } from '../application/query-usecases/get-all-posts.usecase';
import { UpdatePostLikeCommand } from '../application/usecases/likesPost/update-post-like.usecase';
import { LikePostInputDto } from './input-dto/likesPost/like-post.input.dto';
import { JwtAuthGuard } from '../../../auth-manage/guards/bearer/jwt-auth-guard';
import { OptionalJwtAuthGuard } from '../../../auth-manage/guards/bearer/optional-jwt-auth-guard';
import { ExtractUserForJwtGuard } from '../../../auth-manage/guards/decorators/param/extract-user-for-jwt-guard.decorator';
import { ExtractUserIdForJwtOptionalGuard } from '../../../auth-manage/guards/decorators/param/extract-user-id-for-jwt-optional-guard.decorator';
import { UserContextDto } from '../../../auth-manage/guards/dto/user-context.dto';
import { BasicAuthGuard } from '../../../auth-manage/guards/basic/basic-auth.guard';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecase';
import { GetCommentsForPostQuery } from '../../comments/application/query-usecases/get-comments-for-post.usecase';
import { CreateCommentInputDto } from '../../comments/api/input-dto/create-comment.input.dto';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../comments/api/view-dto/comment.view-dto';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get post by id' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post found' })
  async getById(
    @Param('id') id: string,
    @ExtractUserIdForJwtOptionalGuard() userId?: string,
  ): Promise<PostViewDto> {
    return this.queryBus.execute(new GetPostByIdQuery(id, userId));
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all posts' })
  @ApiQuery({ name: 'pageNumber', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortDirection', required: false })
  @ApiResponse({ status: 200, description: 'List of posts' })
  async getAll(
    @Query() query: GetPostsQueryParams,
    @ExtractUserIdForJwtOptionalGuard() userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.queryBus.execute(new GetAllPostsQuery(query, userId));
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Create a post' })
  @ApiBody({ type: CreatePostInputDto })
  @ApiResponse({ status: 201, description: 'Post created' })
  async create(@Body() body: CreatePostInputDto): Promise<PostViewDto> {
    return this.commandBus.execute(new CreatePostCommand(body, undefined));
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiBody({ type: UpdatePostInputDto })
  @ApiResponse({ status: 204, description: 'Post updated' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePostInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdatePostCommand({ id }, body));
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeletePostCommand({ id }));
  }

  @Put(':postId/like-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Make like/unlike/dislike/undislike operation' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiBody({ type: LikePostInputDto })
  @ApiResponse({ status: 204, description: 'Like status updated' })
  @ApiResponse({
    status: 400,
    description: 'If the inputModel has incorrect values',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'If post with specified postId does not exist',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('postId') postId: string,
    @Body() dto: LikePostInputDto,
    @ExtractUserForJwtGuard() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdatePostLikeCommand(postId, user.id, dto),
    );
  }

  @Get(':postId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get comments for post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiQuery({ name: 'pageNumber', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortDirection', required: false })
  @ApiResponse({ status: 200, description: 'List of comments' })
  async getComments(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryParams,
    @ExtractUserIdForJwtOptionalGuard() userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    await this.getById(postId);
    return this.queryBus.execute(
      new GetCommentsForPostQuery(postId, query, userId),
    );
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create comment for post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiBody({ type: CreateCommentInputDto })
  @ApiResponse({ status: 201, description: 'Comment created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'If post with specified postId does not exist',
  })
  async createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentInputDto,
    @ExtractUserForJwtGuard() user: UserContextDto,
  ): Promise<CommentViewDto> {
    return this.commandBus.execute(
      new CreateCommentCommand(dto, postId, user.id),
    );
  }
}
