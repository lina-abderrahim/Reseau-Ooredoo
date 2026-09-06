import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServiceTechnology } from '../service-technologies/entities/service-technology.entity';
import { Technology } from '../technologies/entities/technology.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, ServiceTechnology, Technology])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}