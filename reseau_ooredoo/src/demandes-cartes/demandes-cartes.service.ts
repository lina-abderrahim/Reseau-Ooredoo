import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Demande } from './entities/demandes-carte.entity';
import { CreateDemandeDto } from './dto/create-demandes-carte.dto';
import { UpdateDemandeDto } from './dto/update-demandes-carte.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class DemandesCarteService {
  constructor(
    @InjectRepository(Demande)
    private demandeRepository: Repository<Demande>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(createDemandeDto: CreateDemandeDto): Promise<Demande> {
    const demande = this.demandeRepository.create({
      ...createDemandeDto,
      statut: 'en_attente',
    });
    const saved = await this.demandeRepository.save(demande);

    // ✅ Notification à l'ingénieur
    if (createDemandeDto.ingenieur_id) {
      const notif = await this.notificationsService.create({
        user_id: createDemandeDto.ingenieur_id,
        titre: 'Nouvelle demande',
        message: `L'administrateur vous a assigné une nouvelle carte : "${createDemandeDto.nom}"`,
        type: 'nouvelle_demande',
      });
      this.notificationsGateway.sendNotificationToUser(
        createDemandeDto.ingenieur_id,
        notif,
      );
    }

    return saved;
  }

  async findAll(): Promise<Demande[]> {
    return this.demandeRepository.find({ order: { date_creation: 'DESC' } });
  }

  async findByIngenieur(ingenieurId: number): Promise<Demande[]> {
    return this.demandeRepository.find({
      where: { ingenieur_id: ingenieurId },
      order: { date_creation: 'DESC' },
    });
  }

  async findByIngenieurEmail(ingenieurEmail: string): Promise<Demande[]> {
    return this.demandeRepository.find({
      where: { ingenieur_email: ingenieurEmail },
      order: { date_creation: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Demande> {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande #${id} non trouvée`);
    return demande;
  }

  async update(id: number, updateDemandeDto: UpdateDemandeDto): Promise<Demande> {
    const demande = await this.findOne(id);
    Object.assign(demande, updateDemandeDto);
    return this.demandeRepository.save(demande);
  }

  async remove(id: number): Promise<void> {
    const demande = await this.findOne(id);
    await this.demandeRepository.remove(demande);
  }
}