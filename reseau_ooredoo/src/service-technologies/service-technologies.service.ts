import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceTechnology } from './entities/service-technology.entity';
import { CreateServiceTechnologyDto } from './dto/create-service-technology.dto';
import { UpdateServiceTechnologyDto } from './dto/update-service-technology.dto';

@Injectable()
export class ServiceTechnologiesService {
  constructor(
    @InjectRepository(ServiceTechnology)
    private readonly stRepo: Repository<ServiceTechnology>,
  ) {}

  async create(dto: CreateServiceTechnologyDto) {
    const newST = this.stRepo.create({
      service: { id: dto.service } as any,
      technology: { id: dto.technology } as any,
    });
    return await this.stRepo.save(newST);
  }

  async findAll() {
    return await this.stRepo.find({ relations: ['service', 'technology'] });
  }

  async findOne(id: number) {
    const record = await this.stRepo.findOne({ 
      where: { id }, 
      relations: ['service', 'technology'] 
    });
    if (!record) throw new NotFoundException(`Association #${id} non trouvée`);
    return record;
  }

  async update(id: number, updateDto: UpdateServiceTechnologyDto) {
    const record = await this.stRepo.preload({
      id: id,
      service: updateDto.service ? { id: updateDto.service } as any : undefined,
      technology: updateDto.technology ? { id: updateDto.technology } as any : undefined,
    });
    if (!record) throw new NotFoundException(`Association #${id} inexistante`);
    return await this.stRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    return await this.stRepo.remove(record);
  }
}