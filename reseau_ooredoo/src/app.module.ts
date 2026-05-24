import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Modules
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { TechnologiesModule } from './technologies/technologies.module';
import { ServiceTechnologiesModule } from './service-technologies/service-technologies.module';
import { DemandesCarteModule } from './demandes-cartes/demandes-cartes.module';
import { CartesCouvertureModule } from './cartes-couverture/cartes-couverture.module';
import { PolygonsModule } from './polygons/polygons.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GeminiModule } from './gemini/gemini.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    UsersModule,
    ServicesModule,
    TechnologiesModule,
    ServiceTechnologiesModule,
    DemandesCarteModule,
    CartesCouvertureModule,
    PolygonsModule,
    AuthModule,
    NotificationsModule,
    GeminiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}