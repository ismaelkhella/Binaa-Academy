import { IsNotEmpty, IsString } from 'class-validator';

export class AddCartItemDto {
  @IsNotEmpty()
  @IsString()
  subjectId: string;
}
