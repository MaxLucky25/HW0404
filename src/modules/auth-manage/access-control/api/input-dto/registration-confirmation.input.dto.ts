// import { IsStringWithTrim } from 'src/core/decorators/validation/is-string-with-trim';
// import { confirmationCodeConstrains } from 'src/modules/auth-manage/access-control/api/input-dto/auth-constraints';

import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { confirmationCodeConstrains } from './auth-constraints';

export class RegistrationConfirmationInputDto {
  @IsStringWithTrim(
    confirmationCodeConstrains.minLength,
    confirmationCodeConstrains.maxLength,
  )
  code: string;
}
