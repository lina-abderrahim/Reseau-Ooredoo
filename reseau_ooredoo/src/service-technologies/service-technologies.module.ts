import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceTechnologiesService } from './service-technologies.service';
import { ServiceTechnologiesController } from './service-technologies.controller';
import { ServiceTechnology } from './entities/service-technology.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceTechnology])],
  controllers: [ServiceTechnologiesController],
  providers: [ServiceTechnologiesService],
})
export class ServiceTechnologiesModule {}