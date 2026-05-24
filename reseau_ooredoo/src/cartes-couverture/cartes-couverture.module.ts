import { Module } from '@nestjs/common';
import { CartesCouvertureService } from './cartes-couverture.service';
import { CartesCouvertureController } from './cartes-couverture.controller';
import { TilesController } from './tiles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartesCouverture } from './entities/cartes-couverture.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartesCouverture]),
    NotificationsModule,
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [CartesCouvertureController, TilesController],
  providers: [CartesCouvertureService],
})
export class CartesCouvertureModule {}