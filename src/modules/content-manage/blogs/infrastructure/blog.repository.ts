import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import {
  CreateBlogDomainDto,
  FindByIdDto,
} from '../domain/dto/blog.domain.dto';

@Injectable()
export class BlogRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async findById(dto: FindByIdDto): Promise<BlogDocument | null> {
    return this.BlogModel.findOne({ _id: dto.id, deletedAt: null });
  }

  async findOrNotFoundFail(id: FindByIdDto): Promise<BlogDocument> {
    const blog = await this.findById(id);

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
        field: 'Blog',
      });
    }

    return blog;
  }

  async createBlog(dto: CreateBlogDomainDto): Promise<BlogDocument> {
    const blog = this.BlogModel.createBlog(dto);
    await blog.save();
    return blog;
  }

  async save(blog: BlogDocument): Promise<void> {
    await blog.save();
  }
}
