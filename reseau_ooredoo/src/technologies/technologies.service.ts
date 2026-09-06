import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technology } from './entities/technology.entity';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';
import { ServiceTechnology } from '../service-technologies/entities/service-technology.entity';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class TechnologiesService {
  constructor(
    @InjectRepository(Technology)
    private readonly techRepo: Repository<Technology>,

    @InjectRepository(ServiceTechnology)
    private readonly stRepo: Repository<ServiceTechnology>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async create(dto: CreateTechnologyDto) {
    const newTech = this.techRepo.create(dto);
    const saved = await this.techRepo.save(newTech);

    // ✅ Créer automatiquement les combinaisons avec tous les services existants
    const services = await this.serviceRepo
      .createQueryBuilder('service')
      .select(['service.id'])
      .getMany();

    for (const service of services) {
      await this.stRepo.save(
        this.stRepo.create({
          technology: { id: saved.id },
          service: { id: service.id },
        })
      );
    }

    return saved;
  }

  async findAll() {
    return await this.techRepo
      .createQueryBuilder('tech')
      .select(['tech.id', 'tech.nom_technologie', 'tech.created_at'])
      .getMany();
  }

  async findOne(id: number) {
    const tech = await this.techRepo
      .createQueryBuilder('tech')
      .select(['tech.id', 'tech.nom_technologie', 'tech.created_at'])
      .where('tech.id = :id', { id })
      .getOne();
    if (!tech) throw new NotFoundException(`Technologie #${id} non trouvée`);
    return tech;
  }

  async update(id: number, updateTechnologyDto: UpdateTechnologyDto) {
    const tech = await this.techRepo.preload({ id, ...updateTechnologyDto });
    if (!tech) throw new NotFoundException(`Technologie #${id} inexistante`);
    return await this.techRepo.save(tech);
  }

  async remove(id: number) {
    // ✅ Supprimer d'abord les combinaisons dans service_technologies
    await this.stRepo
      .createQueryBuilder()
      .delete()
      .where('technology_id = :id', { id })
      .execute();

    const tech = await this.findOne(id);
    return await this.techRepo.remove(tech);
  }
}