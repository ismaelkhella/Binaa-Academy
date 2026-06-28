import { IsString, Matches, Length } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @Matches(/^05\d{8}$/, { message: 'رقم الهاتف يجب أن يكون فلسطينياً (05XXXXXXXX)' })
  phone!: string;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(/^05\d{8}$/)
  phone!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

export class SetupProfileDto {
  @IsString()
  grade!: 'GRADE_11' | 'GRADE_12';

  @IsString()
  branch!: 'SCIENTIFIC' | 'LITERARY';
}

export class AdminLoginDto {
  @IsString()
  email!: string;

  @IsString()
  password!: string;
}

export class UpdateParentPhoneDto {
  @IsString()
  @Matches(/^05\d{8}$/)
  parentPhone!: string;
}
