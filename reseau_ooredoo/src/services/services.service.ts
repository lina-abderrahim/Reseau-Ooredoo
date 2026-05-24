import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createDto: CreateServiceDto) {
    const service = this.serviceRepository.create(createDto);
    return await this.serviceRepository.save(service);
  }

  // ✅ Sans relations — évite circular reference
  async findAll(): Promise<Service[]> {
    return await this.serviceRepository
      .createQueryBuilder('service')
      .select(['service.id', 'service.nom_service', 'service.created_at'])
      .getMany();
  }

  async findOne(id: number): Promise<Service> {
    const service = await this.serviceRepository
      .createQueryBuilder('service')
      .select(['service.id', 'service.nom_service', 'service.created_at'])
      .where('service.id = :id', { id })
      .getOne();
    if (!service) throw new NotFoundException(`Service #${id} non trouvé`);
    return service;
  }

  async update(id: number, updateDto: UpdateServiceDto) {
    const service = await this.serviceRepository.preload({ id, ...updateDto });
    if (!service) throw new NotFoundException(`Service #${id} non trouvé`);
    return this.serviceRepository.save(service);
  }

  async remove(id: number) {
    const service = await this.findOne(id);
    return this.serviceRepository.remove(service);
  }
}