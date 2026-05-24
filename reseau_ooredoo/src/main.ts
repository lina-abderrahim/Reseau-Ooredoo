import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // ✅ Augmenter la limite à 100mb pour les gros fichiers SHP
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  const config = new DocumentBuilder()
    .setTitle('Ooredoo Network API')
    .setDescription('Système de gestion des cartes de couverture Ooredoo')
    .setVersion('1.0')
    .addTag('couverture')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);

  Logger.log('🚀 Serveur Ooredoo lancé sur : http://localhost:3000', 'Bootstrap');
  Logger.log('📖 Swagger disponible sur : http://localhost:3000/api', 'Bootstrap');
}
bootstrap();