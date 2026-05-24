import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemandesCarteService } from './demandes-cartes.service';
import { DemandesCarteController } from './demandes-cartes.controller';
import { Demande } from './entities/demandes-carte.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Demande]),
    NotificationsModule,
  ],
  controllers: [DemandesCarteController],
  providers: [DemandesCarteService],
  exports: [DemandesCarteService],
})
export class DemandesCarteModule {}