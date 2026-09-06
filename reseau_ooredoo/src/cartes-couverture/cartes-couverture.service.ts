import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartesCouverture } from './entities/cartes-couverture.entity';
import { CreateCartesCouvertureDto } from './dto/create-cartes-couverture.dto';
import { UpdateCartesCouvertureDto } from './dto/update-cartes-couverture.dto';
import { User } from '../users/entities/user.entity';
import { ServiceTechnology } from '../service-technologies/entities/service-technology.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Pool } from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'nadouna123',
  database: process.env.DB_DATABASE || 'ooredoo_db',
  max: 20,
});

const QGIS_BIN    = 'C:\\Program Files\\QGIS 3.44.8\\bin';
const OGR2OGR     = `${QGIS_BIN}\\ogr2ogr.exe`;
const PROJ_DATA   = 'C:\\Program Files\\QGIS 3.44.8\\share\\proj';
const GDAL_DATA   = 'C:\\Program Files\\QGIS 3.44.8\\share\\gdal';

const OGR_ENV = {
  ...process.env,
  PATH: `${QGIS_BIN};${process.env.PATH || ''}`,
  PROJ_DATA,
  PROJ_LIB: PROJ_DATA,
  GDAL_DATA,
};

const OGR_PG_CONN = `PG:host=${process.env.DB_HOST || 'localhost'} port=${process.env.DB_PORT || '5432'} dbname=${process.env.DB_DATABASE || 'ooredoo_db'} user=${process.env.DB_USERNAME || 'postgres'} password=${process.env.DB_PASSWORD || 'nadouna123'}`;

@Injectable()
export class CartesCouvertureService {
  constructor(
    @InjectRepository(CartesCouverture)
    private readonly carteRepository: Repository<CartesCouverture>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private async writeShpToDisk(
    shpBuffer: Buffer,
    dbfBuffer: Buffer,
    shxBuffer?: Buffer,
  ): Promise<{ dir: string; shpPath: string }> {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shp-'));
    const shpPath = path.join(dir, 'layer.shp');
    const dbfPath = path.join(dir, 'layer.dbf');
    const shxPath = path.join(dir, 'layer.shx');

    fs.writeFileSync(shpPath, shpBuffer);
    fs.writeFileSync(dbfPath, dbfBuffer);
    if (shxBuffer) fs.writeFileSync(shxPath, shxBuffer);

    return { dir, shpPath };
  }

  private cleanupDir(dir: string) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { }
  }

  private buildOgrCommand(
    shpPath: string,
    targetTable: string,
    idColumn: string,
    idValue: string | number,
    qualite: string,
  ): string {
    return [
      `"${OGR2OGR}"`,
      '-f PostgreSQL',
      `"${OGR_PG_CONN}"`,
      `"${shpPath}"`,
      `-nln ${targetTable}`,
      '-append',
      '-t_srs EPSG:3857',
      '-lco GEOMETRY_NAME=geom',
      '--config PG_USE_COPY YES',
      '--config SHAPE_RESTORE_SHX YES',
      `--config OGR_TRUNCATE NO`,
    ].join(' ');
  }

  async previewShp(
    shpBuffer: Buffer,
    dbfBuffer: Buffer,
    qualite: string,
    carteId?: number,
    shxBuffer?: Buffer,
  ) {
    const { dir, shpPath } = await this.writeShpToDisk(shpBuffer, dbfBuffer, shxBuffer);

    try {
      if (carteId) {
        const command = [
          `"${OGR2OGR}"`,
          '-f PostgreSQL',
          `"${OGR_PG_CONN}"`,
          `"${shpPath}"`,
          '-nln shp_layers',
          '-append',
          '-s_srs EPSG:4326',
          '-t_srs EPSG:3857',
          '-lco GEOMETRY_NAME=geom',
          '--config PG_USE_COPY YES',
          '--config SHAPE_RESTORE_SHX YES',
        ].join(' ');

        await execAsync(command, { env: OGR_ENV });

        await pgPool.query(
          `UPDATE shp_layers SET carte_id = $1, qualite = $2
           WHERE carte_id IS NULL OR carte_id = 0`,
          [carteId, qualite],
        );

        const countResult = await pgPool.query(
          'SELECT COUNT(*) FROM shp_layers WHERE carte_id = $1 AND qualite = $2',
          [carteId, qualite],
        );
        return { count: parseInt(countResult.rows[0].count, 10) };
      }
      return { count: 0 };
    } catch (error) {
      console.error('Erreur ogr2ogr previewShp:', error);
      throw error;
    } finally {
      this.cleanupDir(dir);
    }
  }

  async previewShpTemp(
    shpBuffer: Buffer,
    dbfBuffer: Buffer,
    qualite: string,
    sessionId: string,
    shxBuffer?: Buffer,
  ) {
    await pgPool.query(
      'DELETE FROM shp_temp WHERE session_id = $1 AND qualite = $2',
      [sessionId, qualite],
    );

    const { dir, shpPath } = await this.writeShpToDisk(shpBuffer, dbfBuffer, shxBuffer);

    try {
      const beforeResult = await pgPool.query('SELECT COALESCE(MAX(id), 0) AS max_id FROM shp_temp');
      const maxIdBefore = parseInt(beforeResult.rows[0].max_id, 10);

      const command = [
        `"${OGR2OGR}"`,
        '-f PostgreSQL',
        `"${OGR_PG_CONN}"`,
        `"${shpPath}"`,
        '-nln shp_temp',
        '-append',
        '-s_srs EPSG:4326',
        '-t_srs EPSG:3857',
        '-lco GEOMETRY_NAME=geom',
        '--config PG_USE_COPY YES',
        '--config SHAPE_RESTORE_SHX YES',
      ].join(' ');

      await execAsync(command, { env: OGR_ENV });

      await pgPool.query(
        `UPDATE shp_temp SET session_id = $1, qualite = $2
         WHERE id > $3`,
        [sessionId, qualite, maxIdBefore],
      );

      const countResult = await pgPool.query(
        'SELECT COUNT(*) FROM shp_temp WHERE session_id = $1 AND qualite = $2',
        [sessionId, qualite],
      );

      return { count: parseInt(countResult.rows[0].count, 10), session_id: sessionId, qualite };
    } catch (error) {
      console.error('Erreur ogr2ogr previewShpTemp:', error);
      throw error;
    } finally {
      this.cleanupDir(dir);
    }
  }

  async transferTempToLayers(sessionId: string, carteId: number) {
    try {
      await pgPool.query(
        `INSERT INTO shp_layers (carte_id, qualite, geom)
         SELECT $1, qualite, geom FROM shp_temp WHERE session_id = $2`,
        [carteId, sessionId],
      );
      await pgPool.query('DELETE FROM shp_temp WHERE session_id = $1', [sessionId]);
    } catch (e) {
      console.error('Erreur transfert temp:', e);
    }
  }

  async duplicateShpLayers(sourceCarteId: number, targetCarteId: number) {
    try {
      await pgPool.query(
        `INSERT INTO shp_layers (carte_id, qualite, geom)
         SELECT $1, qualite, geom FROM shp_layers WHERE carte_id = $2`,
        [targetCarteId, sourceCarteId],
      );
    } catch (e) {
      console.error('Erreur duplication shp_layers:', e);
    }
  }

  async deleteShpLayers(carteId: number, qualiteParam?: string) {
    try {
      if (qualiteParam) {
        await pgPool.query(
          'DELETE FROM shp_layers WHERE carte_id = $1 AND qualite = $2',
          [carteId, qualiteParam],
        );
      } else {
        await pgPool.query('DELETE FROM shp_layers WHERE carte_id = $1', [carteId]);
      }
    } catch (e) {
      console.error('Erreur suppression shp_layers:', e);
    }
  }

  async create(createDto: CreateCartesCouvertureDto) {
    const { user_id, service_technologie_id, polygones, session_id, ...rest } = createDto;
    const nouvelleCarte = this.carteRepository.create({
      ...rest,
      user: user_id ? ({ id: user_id } as User) : undefined,
      service_technologie: service_technologie_id
        ? ({ id: service_technologie_id } as ServiceTechnology)
        : undefined,
      polygones: polygones?.map((p) => ({
        coordinates: p.coordinates,
        qualite: p.qualite,
      })) ?? [],
    });
    const saved = await this.carteRepository.save(nouvelleCarte);

    if (createDto.is_duplicated === true) {
      await pgPool.query(
        'UPDATE cartes_couverture SET is_duplicated = true WHERE id = $1',
        [saved.id],
      );
      saved.is_duplicated = true;
    }

    return saved;
  }

  async findAll(): Promise<CartesCouverture[]> {
    return await this.carteRepository.find({
      relations: ['polygones', 'service_technologie', 'service_technologie.technology', 'service_technologie.service', 'user'],
    });
  }

  async findPubliees(): Promise<CartesCouverture[]> {
    return await this.carteRepository.find({
      where: { statut: 'publie' },
      relations: ['polygones', 'service_technologie', 'service_technologie.technology', 'service_technologie.service'],
    });
  }

  async findOne(id: number): Promise<CartesCouverture> {
    const carte = await this.carteRepository.findOne({
      where: { id },
      relations: ['polygones', 'service_technologie', 'service_technologie.technology', 'service_technologie.service', 'user'],
    });
    if (!carte) throw new NotFoundException(`Carte #${id} non trouvée`);
    return carte;
  }

  async update(id: number, updateDto: UpdateCartesCouvertureDto): Promise<CartesCouverture> {
    const carteAvant = await this.carteRepository.findOne({
      where: { id },
      relations: ['user', 'service_technologie', 'service_technologie.technology', 'service_technologie.service', 'polygones'],
    });
    if (!carteAvant) throw new NotFoundException(`Carte #${id} non trouvée`);

    // ✅ Gestion publication — supprimer les anciennes cartes publiées avec les mêmes qualités
    if (updateDto.statut === 'publie') {
      const qualitesCarte = carteAvant.polygones?.map((p) => p.qualite) || [];
      const serviceTechId = carteAvant.service_technologie?.id;
      const anciennesCartes = await this.carteRepository.find({
        where: { statut: 'publie', service_technologie: { id: serviceTechId } },
        relations: ['polygones', 'service_technologie'],
      });
      for (const ancienneCarte of anciennesCartes) {
        if (ancienneCarte.id === id) continue;
        ancienneCarte.polygones = ancienneCarte.polygones.filter((p) => !qualitesCarte.includes(p.qualite));
        if (ancienneCarte.polygones.length === 0) {
          await this.carteRepository.remove(ancienneCarte);
        } else {
          await this.carteRepository.save(ancienneCarte);
        }
      }
    }

    // ✅ Gestion session_id — transfert des polygones SHP temporaires vers shp_layers
    if (updateDto.session_id) {
      const sessionId = updateDto.session_id;

      // ✅ Supprimer les anciens shp_layers de la qualité remplacée
      if (updateDto.qualite) {
        await pgPool.query(
          'DELETE FROM shp_layers WHERE carte_id = $1 AND qualite = $2',
          [id, updateDto.qualite],
        );
      }

      // ✅ Transférer les nouveaux polygones SHP temp vers shp_layers
      await pgPool.query(
        `INSERT INTO shp_layers (carte_id, qualite, geom)
         SELECT $1, qualite, geom FROM shp_temp WHERE session_id = $2`,
        [id, sessionId],
      );

      // ✅ Nettoyer la table temp
      await pgPool.query(
        'DELETE FROM shp_temp WHERE session_id = $1',
        [sessionId],
      );
    }

    // ✅ Extraire session_id et qualite du DTO avant preload
    // pour éviter de les passer à TypeORM
    const { session_id, qualite, ...restDto } = updateDto as any;

    const carte = await this.carteRepository.preload({ id, ...restDto });
    if (!carte) throw new NotFoundException(`Carte #${id} non trouvée`);
    const updated = await this.carteRepository.save(carte);

    // ✅ Notifications
    if (updateDto.statut && carteAvant.user?.id) {
      let titre = '', message = '', type = '';
      if (updateDto.statut === 'accepte') {
        titre = 'Carte acceptée';
        message = `Votre carte "${carteAvant.nom}" a été acceptée`;
        type = 'carte_acceptee';
      } else if (updateDto.statut === 'refuse') {
        titre = 'Carte refusée';
        message = `Votre carte "${carteAvant.nom}" a été refusée`;
        type = 'carte_refusee';
      } else if (updateDto.statut === 'publie') {
        titre = 'Carte publiée';
        message = `Votre carte "${carteAvant.nom}" a été publiée`;
        type = 'carte_publiee';
      }

      if (titre) {
        const notif = await this.notificationsService.create({
          user_id: carteAvant.user.id,
          titre,
          message,
          type,
        });
        this.notificationsGateway.sendNotificationToUser(carteAvant.user.id, notif);
      }
    }

    return updated;
  }

  async remove(id: number) {
    const carte = await this.findOne(id);
    try { await pgPool.query('DELETE FROM shp_layers WHERE carte_id = $1', [id]); } catch { }
    return this.carteRepository.remove(carte);
  }
}