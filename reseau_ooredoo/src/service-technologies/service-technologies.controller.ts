import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceTechnologiesService } from './service-technologies.service';
import { CreateServiceTechnologyDto } from './dto/create-service-technology.dto';
import { UpdateServiceTechnologyDto } from './dto/update-service-technology.dto';

@Controller('service-technologies')
export class ServiceTechnologiesController {
  constructor(private readonly serviceTechnologiesService: ServiceTechnologiesService) {}

  @Post()
  create(@Body() createServiceTechnologyDto: CreateServiceTechnologyDto) {
    return this.serviceTechnologiesService.create(createServiceTechnologyDto);
  }

  @Get()
  findAll() {
    return this.serviceTechnologiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceTechnologiesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceTechnologyDto: UpdateServiceTechnologyDto) {
    return this.serviceTechnologiesService.update(+id, updateServiceTechnologyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceTechnologiesService.remove(+id);
  }
}
