import { PartialType } from '@nestjs/mapped-types';
import { CreatePolygonDto } from './create-polygon.dto';

export class UpdatePolygonDto extends PartialType(CreatePolygonDto) {}
