export class CreateCommentDomainDto {
  content: string;
  postId: string;
  commentatorId: string;
  commentatorLogin: string;
}

export class FindCommentByIdDto {
  id: string;
}

export class UpdateCommentDomainDto {
  content: string;
}
