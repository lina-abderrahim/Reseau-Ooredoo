import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CartesCouvertureService } from './cartes-couverture.service';
import { CreateCartesCouvertureDto } from './dto/create-cartes-couverture.dto';
import { UpdateCartesCouvertureDto } from './dto/update-cartes-couverture.dto';

@Controller('cartes-couverture')
export class CartesCouvertureController {
  constructor(private readonly cartesCouvertureService: CartesCouvertureService) {}

  @Post()
  async create(@Body() createDto: CreateCartesCouvertureDto) {
    // Créer la carte
    const carte = await this.cartesCouvertureService.create(createDto);
    // ✅ Transférer les polygones SHP de shp_temp vers shp_layers
    if (createDto.session_id && carte?.id) {
      await this.cartesCouvertureService.transferTempToLayers(
        createDto.session_id,
        carte.id,
      );
    }
    return carte;
  }

  @Post('preview-shp')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'shp', maxCount: 1 },
    { name: 'dbf', maxCount: 1 },
    { name: 'shx', maxCount: 1 },
  ]))
  async previewShp(
    @UploadedFiles() files: { shp?: Express.Multer.File[], dbf?: Express.Multer.File[], shx?: Express.Multer.File[] },
    @Body() body: { qualite: string },
  ) {
    return this.cartesCouvertureService.previewShp(
      files.shp?.[0]?.buffer,
      files.dbf?.[0]?.buffer,
      body.qualite,
      undefined,
      files.shx?.[0]?.buffer,
    );
  }

  @Post('preview-shp-temp')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'shp', maxCount: 1 },
    { name: 'dbf', maxCount: 1 },
    { name: 'shx', maxCount: 1 },
  ]))
  async previewShpTemp(
    @UploadedFiles() files: { shp?: Express.Multer.File[], dbf?: Express.Multer.File[], shx?: Express.Multer.File[] },
    @Body() body: { qualite: string; session_id: string },
  ) {
    return this.cartesCouvertureService.previewShpTemp(
      files.shp?.[0]?.buffer,
      files.dbf?.[0]?.buffer,
      body.qualite,
      body.session_id,
      files.shx?.[0]?.buffer,
    );
  }

  @Post('save-shp/:carteId')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'shp', maxCount: 1 },
    { name: 'dbf', maxCount: 1 },
    { name: 'shx', maxCount: 1 },
  ]))
  async saveShp(
    @UploadedFiles() files: { shp?: Express.Multer.File[], dbf?: Express.Multer.File[], shx?: Express.Multer.File[] },
    @Param('carteId') carteId: string,
    @Body() body: { qualite: string },
  ) {
    return this.cartesCouvertureService.previewShp(
      files.shp?.[0]?.buffer,
      files.dbf?.[0]?.buffer,
      body.qualite,
      Number(carteId),
      files.shx?.[0]?.buffer,
    );
  }

  @Post('transfer-temp/:carteId')
  async transferTemp(
    @Param('carteId') carteId: string,
    @Body() body: { session_id: string },
  ) {
    return this.cartesCouvertureService.transferTempToLayers(
      body.session_id,
      Number(carteId),
    );
  }

  @Post('duplicate-shp/:sourceCarteId/:targetCarteId')
  async duplicateShp(
    @Param('sourceCarteId') sourceCarteId: string,
    @Param('targetCarteId') targetCarteId: string,
  ) {
    return this.cartesCouvertureService.duplicateShpLayers(
      Number(sourceCarteId),
      Number(targetCarteId),
    );
  }

  @Delete('delete-shp/:carteId')
  async deleteShp(
    @Param('carteId') carteId: string,
    @Body() body: { qualiteParam?: string },
  ) {
    return this.cartesCouvertureService.deleteShpLayers(
      Number(carteId),
      body?.qualiteParam,
    );
  }

  @Get()
  findAll() {
    return this.cartesCouvertureService.findAll();
  }

  @Get('publiques')
  findPubliees() {
    return this.cartesCouvertureService.findPubliees();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartesCouvertureService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateCartesCouvertureDto) {
    return this.cartesCouvertureService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartesCouvertureService.remove(+id);
  }
}