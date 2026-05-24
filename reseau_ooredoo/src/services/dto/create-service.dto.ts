import { IsString } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  nom_service: string;
}