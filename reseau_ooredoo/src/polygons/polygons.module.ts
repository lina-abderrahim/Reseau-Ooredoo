import { Module } from '@nestjs/common';
import { PolygonsService } from './polygons.service';
import { PolygonsController } from './polygons.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Polygone } from './entities/polygon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Polygone])],
  controllers: [PolygonsController],
  providers: [PolygonsService],
})
export class PolygonsModule {}
