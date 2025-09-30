export class CreateSessionDomainDto {
  token: string;
  userId: string;
  deviceId: string;
  ip: string;
  userAgent: string;
  title: string;
  expiresIn: number;
}
