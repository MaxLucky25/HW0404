export class CreateBlogDomainDto {
  name: string;
  description: string;
  websiteUrl: string;
}

export class FindByIdDto {
  id: string;
}

export class FindByNameDto {
  name: string;
}
