import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
