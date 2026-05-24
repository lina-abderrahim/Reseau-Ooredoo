import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PolygonsService } from './polygons.service';
import { CreatePolygonDto } from './dto/create-polygon.dto';
import { UpdatePolygonDto } from './dto/update-polygon.dto';

@Controller('polygons')
export class PolygonsController {
  constructor(private readonly polygonsService: PolygonsService) {}

  @Post()
  create(@Body() createPolygonDto: CreatePolygonDto) {
    return this.polygonsService.create(createPolygonDto);
  }

  @Get()
  findAll() {
    return this.polygonsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.polygonsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePolygonDto: UpdatePolygonDto) {
    return this.polygonsService.update(+id, updatePolygonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.polygonsService.remove(+id);
  }
}
