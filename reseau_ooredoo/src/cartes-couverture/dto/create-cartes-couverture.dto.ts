import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
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
  service_technologie_id: number;

  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePolygoneDto)
  polygones?: CreatePolygoneDto[];

  // ✅ session_id pour transférer les polygones SHP temp vers shp_layers
  @IsString()
  @IsOptional()
  session_id?: string;
}