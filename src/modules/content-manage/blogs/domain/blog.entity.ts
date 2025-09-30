import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateBlogDomainDto } from './dto/blog.domain.dto';
import { UpdateBlogInputDto } from '../api/input-dto/update-blog.input.dto';

@Schema({ timestamps: true })
export class Blog {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: true })
  websiteUrl: string;

  @Prop({ type: Date, default: new Date() })
  createdAt: Date;

  @Prop({ type: Boolean, required: true })
  isMembership: boolean;

  @Prop({ type: Date, required: false, default: null })
  deletedAt: Date | null;

  static createBlog(dto: CreateBlogDomainDto): BlogDocument {
    const blog = new this();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.createdAt = new Date();
    blog.isMembership = false;

    return blog as BlogDocument;
  }

  makeDeleted() {
    this.deletedAt = new Date();
  }
  update(dto: UpdateBlogInputDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
}
// Добавляет монгошную схему
export const BlogSchema = SchemaFactory.createForClass(Blog);
// Добавляет методы класов к модели
BlogSchema.loadClass(Blog);
// Добавляет объекту методы умных объектов mongoose
export type BlogDocument = HydratedDocument<Blog>;
// Создает объек со всеми встроенными и статическими методами
export type BlogModelType = Model<BlogDocument> & typeof Blog;
