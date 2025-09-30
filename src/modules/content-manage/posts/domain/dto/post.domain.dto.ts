export class CreatePostDomainDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
}

export class FindPostByIdDto {
  id: string;
}

export class BlogIdDto {
  blogId: string;
}
