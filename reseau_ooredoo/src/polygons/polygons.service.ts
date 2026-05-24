import { Injectable } from '@nestjs/common';
import { CreatePolygonDto } from './dto/create-polygon.dto';
import { UpdatePolygonDto } from './dto/update-polygon.dto';

@Injectable()
export class PolygonsService {
  create(createPolygonDto: CreatePolygonDto) {
    return 'This action adds a new polygon';
  }

  findAll() {
    return `This action returns all polygons`;
  }

  findOne(id: number) {
    return `This action returns a #${id} polygon`;
  }

  update(id: number, updatePolygonDto: UpdatePolygonDto) {
    return `This action updates a #${id} polygon`;
  }

  remove(id: number) {
    return `This action removes a #${id} polygon`;
  }
}
