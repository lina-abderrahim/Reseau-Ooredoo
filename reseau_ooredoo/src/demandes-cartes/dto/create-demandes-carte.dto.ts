import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateDemandeDto {
  @IsString()
  nom: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  technologie: string;

  @IsString()
  service: string;

  @IsArray()
  qualites: string[]; // ✅ tableau

  @IsArray()
  @IsOptional()
  polygones?: any[];

  @IsNumber()
  ingenieur_id: number;

  @IsString()
  ingenieur_nom: string;

  @IsString()
  ingenieur_email: string;
}