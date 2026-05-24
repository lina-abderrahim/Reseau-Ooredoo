import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceTechnologyDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  service: number;

  @ApiProperty({ example: 6 })
  @IsNumber()
  @IsNotEmpty()
  technology: number;
}