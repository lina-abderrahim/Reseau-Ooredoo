import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technology } from './entities/technology.entity';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';

@Injectable()
export class TechnologiesService {
  constructor(
    @InjectRepository(Technology)
    private readonly techRepo: Repository<Technology>,
  ) {}

  async create(dto: CreateTechnologyDto) {
    const newTech = this.techRepo.create(dto);
    return await this.techRepo.save(newTech);
  }

  // ✅ Sans relations — évite circular reference
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
    const tech = await this.techRepo.preload({
      id: id,
      ...updateTechnologyDto,
    });
    if (!tech) throw new NotFoundException(`Technologie #${id} inexistante`);
    return await this.techRepo.save(tech);
  }

  async remove(id: number) {
    const tech = await this.findOne(id);
    return await this.techRepo.remove(tech);
  }
}