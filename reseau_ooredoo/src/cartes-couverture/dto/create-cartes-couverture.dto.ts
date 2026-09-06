import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreatePolygoneDto {
  @IsString()
  coordinates: string;

  @IsString()
  @IsOptional()
  qualite?: string;
}

export class CreateCartesCouvertureDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  statut?: string;

  @IsNumber()
  service_technologie_id?: number;

  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePolygoneDto)
  polygones?: CreatePolygoneDto[];

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsBoolean()
  @IsOptional()
  is_duplicated?: boolean;
}