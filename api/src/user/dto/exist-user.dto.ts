import { IsNotEmpty, IsString } from 'class-validator';

export class ExistUserDto {
  @IsString()
  @IsNotEmpty()
  number: string;
}
