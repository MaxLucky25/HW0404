import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import {
  CreatePostDomainDto,
  FindPostByIdDto,
} from '../domain/dto/post.domain.dto';

@Injectable()
export class PostRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

  async findById(dto: FindPostByIdDto): Promise<PostDocument | null> {
    return this.PostModel.findOne({ _id: dto.id, deletedAt: null });
  }

  async findOrNotFoundFail(id: FindPostByIdDto): Promise<PostDocument> {
    const post = await this.findById(id);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
        field: 'Post',
      });
    }

    return post;
  }

  async createPost(dto: CreatePostDomainDto): Promise<PostDocument> {
    const post = this.PostModel.createPost(dto);
    await post.save();
    return post;
  }

  async save(post: PostDocument) {
    await post.save();
  }
}
