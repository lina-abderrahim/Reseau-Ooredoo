import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DemandesCarteService } from './demandes-cartes.service';
import { CreateDemandeDto } from './dto/create-demandes-carte.dto';
import { UpdateDemandeDto } from './dto/update-demandes-carte.dto';

@Controller('demandes-cartes')
export class DemandesCarteController {
  constructor(private readonly demandesService: DemandesCarteService) {}

  @Post()
  create(@Body() createDemandeDto: CreateDemandeDto) {
    return this.demandesService.create(createDemandeDto);
  }

  @Get()
  findAll() {
    return this.demandesService.findAll();
  }

  @Get('ingenieur/:id')
  findByIngenieur(@Param('id') id: string) {
    return this.demandesService.findByIngenieur(+id);
  }

  @Get('ingenieur-email/:email')
  findByIngenieurEmail(@Param('email') email: string) {
    return this.demandesService.findByIngenieurEmail(email);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.demandesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDemandeDto: UpdateDemandeDto) {
    return this.demandesService.update(+id, updateDemandeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.demandesService.remove(+id);
  }
}