import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceTechnology } from '../service-technologies/entities/service-technology.entity';
import { Technology } from '../technologies/entities/technology.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,

    @InjectRepository(ServiceTechnology)
    private readonly stRepo: Repository<ServiceTechnology>,

    @InjectRepository(Technology)
    private readonly techRepo: Repository<Technology>,
  ) {}

  async create(createDto: CreateServiceDto) {
    const service = this.serviceRepo.create(createDto);
    const saved = await this.serviceRepo.save(service);

    // ✅ Créer automatiquement les combinaisons avec toutes les technologies existantes
    const techs = await this.techRepo
      .createQueryBuilder('tech')
      .select(['tech.id'])
      .getMany();

    for (const tech of techs) {
      await this.stRepo.save(
        this.stRepo.create({
          technology: { id: tech.id },
          service: { id: saved.id },
        })
      );
    }

    return saved;
  }

  async findAll(): Promise<Service[]> {
    return await this.serviceRepo
      .createQueryBuilder('service')
      .select(['service.id', 'service.nom_service', 'service.created_at'])
      .getMany();
  }

  async findOne(id: number): Promise<Service> {
    const service = await this.serviceRepo
      .createQueryBuilder('service')
      .select(['service.id', 'service.nom_service', 'service.created_at'])
      .where('service.id = :id', { id })
      .getOne();
    if (!service) throw new NotFoundException(`Service #${id} non trouvé`);
    return service;
  }

  async update(id: number, updateDto: UpdateServiceDto) {
    const service = await this.serviceRepo.preload({ id, ...updateDto });
    if (!service) throw new NotFoundException(`Service #${id} non trouvé`);
    return this.serviceRepo.save(service);
  }

  async remove(id: number) {
    // ✅ Supprimer d'abord les combinaisons dans service_technologies
    await this.stRepo
      .createQueryBuilder()
      .delete()
      .where('service_id = :id', { id })
      .execute();

    const service = await this.findOne(id);
    return this.serviceRepo.remove(service);
  }
}