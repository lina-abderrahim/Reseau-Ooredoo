import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async create(data: {
    user_id: number;
    titre: string;
    message: string;
    type: string;
  }): Promise<Notification> {
    const notif = this.notifRepo.create(data);
    return await this.notifRepo.save(notif);
  }

  async findByUser(userId: number): Promise<Notification[]> {
    return await this.notifRepo
      .createQueryBuilder('notif')
      .select(['notif.id', 'notif.titre', 'notif.message', 'notif.type', 'notif.lu', 'notif.created_at'])
      .where('notif.user_id = :userId', { userId })
      .orderBy('notif.created_at', 'DESC')
      .take(20)
      .getMany();
  }

  async countUnread(userId: number): Promise<number> {
    return await this.notifRepo.count({
      where: { user_id: userId, lu: false },
    });
  }

  async markAsRead(id: number): Promise<void> {
    await this.notifRepo.update(id, { lu: true });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notifRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ lu: true })
      .where('user_id = :userId', { userId })
      .execute();
  }
}