export class FindByIdDto {
  id: string;
}

export class FindByEmailDto {
  email: string;
}

export class FindByLoginOrEmailDto {
  loginOrEmail: string;
}

export class FindByRecoveryDto {
  recoveryCode: string;
}

export class FindByConfirmationCodeDto {
  confirmationCode: string;
}
