import { Controller, Get, Param, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'nadouna123',
  database: process.env.DB_DATABASE || 'ooredoo_db',
});

@Controller('tiles')
export class TilesController {

  // ─────────────────────────────────────────────
  // BBox — ultra-léger pour fitBounds
  // GET /tiles/:carte_id/bbox
  // ─────────────────────────────────────────────
  @Get(':carte_id/bbox')
  async getBbox(
    @Param('carte_id') carteIdParam: string,
    @Res() res: Response,
  ) {
    try {
      const carteId = parseInt(carteIdParam, 10);
      if (isNaN(carteId)) return res.status(400).json({ message: 'ID invalide' });

      const result = await pool.query(`
        SELECT
          ST_XMin(ST_Extent(ST_Transform(geom, 4326))) as xmin,
          ST_YMin(ST_Extent(ST_Transform(geom, 4326))) as ymin,
          ST_XMax(ST_Extent(ST_Transform(geom, 4326))) as xmax,
          ST_YMax(ST_Extent(ST_Transform(geom, 4326))) as ymax
        FROM shp_layers
        WHERE carte_id = $1
      `, [carteId]);

      const row = result.rows[0];

      // Si pas de shp_layers, essayer polygones manuels
      if (!row || row.xmin === null) {
        const polyResult = await pool.query(`
          SELECT
            MIN(lng::float) as xmin,
            MIN(lat::float) as ymin,
            MAX(lng::float) as xmax,
            MAX(lat::float) as ymax
          FROM (
            SELECT
              (json_array_elements(coordinates::json)->0)::text as lng,
              (json_array_elements(coordinates::json)->1)::text as lat
            FROM polygones
            WHERE carte_id = $1
          ) coords
        `, [carteId]);

        const polyRow = polyResult.rows[0];
        if (!polyRow || polyRow.xmin === null) {
          return res.json(null);
        }

        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.json({
          xmin: parseFloat(polyRow.xmin),
          ymin: parseFloat(polyRow.ymin),
          xmax: parseFloat(polyRow.xmax),
          ymax: parseFloat(polyRow.ymax),
        });
      }

      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.json({
        xmin: parseFloat(row.xmin),
        ymin: parseFloat(row.ymin),
        xmax: parseFloat(row.xmax),
        ymax: parseFloat(row.ymax),
      });

    } catch (error) {
      console.error('Erreur bbox:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // ─────────────────────────────────────────────
  // GeoJSON — carte sauvegardée (shp_layers + polygones manuels)
  // GET /tiles/:carte_id/geojson
  // ─────────────────────────────────────────────
  @Get(':carte_id/geojson')
  async getGeoJson(
    @Param('carte_id') carteIdParam: string,
    @Res() res: Response,
  ) {
    try {
      const carteId = parseInt(carteIdParam, 10);
      if (isNaN(carteId)) {
        return res.status(400).json({ message: 'ID de carte invalide' });
      }

      const shpResult = await pool.query(`
        SELECT json_build_object(
          'type', 'FeatureCollection',
          'features', COALESCE(
            json_agg(
              json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(ST_Transform(geom, 4326))::json,
                'properties', json_build_object('qualite', qualite, 'source', 'shp')
              )
            ) FILTER (WHERE geom IS NOT NULL),
            '[]'::json
          )
        ) AS geojson
        FROM shp_layers
        WHERE carte_id = $1
      `, [carteId]);

      const shpFeatures = shpResult.rows[0]?.geojson?.features || [];

      const polyResult = await pool.query(`
        SELECT json_build_object(
          'type', 'FeatureCollection',
          'features', COALESCE(
            json_agg(
              json_build_object(
                'type', 'Feature',
                'geometry', json_build_object(
                  'type', 'Polygon',
                  'coordinates', json_build_array(coordinates::json)
                ),
                'properties', json_build_object('qualite', qualite, 'source', 'manual')
              )
            ) FILTER (WHERE coordinates IS NOT NULL),
            '[]'::json
          )
        ) AS geojson
        FROM polygones
        WHERE carte_id = $1
      `, [carteId]);

      const manualFeatures = polyResult.rows[0]?.geojson?.features || [];

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      return res.json({
        type: 'FeatureCollection',
        features: [...shpFeatures, ...manualFeatures],
      });

    } catch (error) {
      console.error('Erreur GeoJSON:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // ─────────────────────────────────────────────
  // GeoJSON — session temporaire (preview import SHP)
  // GET /tiles/temp/:session_id/geojson
  // ─────────────────────────────────────────────
  @Get('temp/:session_id/geojson')
  async getGeoJsonTemp(
    @Param('session_id') sessionId: string,
    @Res() res: Response,
  ) {
    try {
      const result = await pool.query(`
        SELECT json_build_object(
          'type', 'FeatureCollection',
          'features', COALESCE(
            json_agg(
              json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(ST_Transform(geom, 4326))::json,
                'properties', json_build_object('qualite', qualite)
              )
            ) FILTER (WHERE geom IS NOT NULL),
            '[]'::json
          )
        ) AS geojson
        FROM shp_temp
        WHERE session_id = $1
      `, [sessionId]);

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      return res.json(
        result.rows[0]?.geojson || { type: 'FeatureCollection', features: [] }
      );

    } catch (error) {
      console.error('Erreur GeoJSON temp:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  }

  // ─────────────────────────────────────────────
  // MVT — shp_layers (carte principale)
  // GET /tiles/:carte_id/:z/:x/:y.pbf
  // ─────────────────────────────────────────────
  @Get(':carte_id/:z/:x/:y.pbf')
  async getTile(
    @Param('carte_id') carteIdParam: string,
    @Param('z') z: string,
    @Param('x') x: string,
    @Param('y') y: string,
    @Query('exclude_qualite') excludeQualite: string,
    @Res() res: Response,
  ) {
    try {
      const zoom = parseInt(z, 10);
      const tileX = parseInt(x, 10);
      const tileY = parseInt(y, 10);
      const carteId = parseInt(carteIdParam, 10);

      if (isNaN(carteId)) {
        return res.status(400).send({ message: 'ID de carte invalide' });
      }

      const filterQuality = excludeQualite ? 'AND qualite != $5' : '';

      const query = `
        SELECT ST_AsMVT(tile, 'shp_layer', 4096, 'geom') AS mvt
        FROM (
          SELECT
            id,
            qualite,
            ST_AsMVTGeom(
              ST_QuantizeCoordinates(geom, 4),
              ST_TileEnvelope($1, $2, $3),
              4096, 64, true
            ) AS geom
          FROM shp_layers
          WHERE carte_id = $4
          ${filterQuality}
          AND geom && ST_TileEnvelope($1, $2, $3)
        ) AS tile
        WHERE geom IS NOT NULL
      `;

      const params: any[] = [zoom, tileX, tileY, carteId];
      if (excludeQualite) params.push(excludeQualite);

      const result = await pool.query(query, params);
      const mvt = result.rows[0]?.mvt;

      if (!mvt || mvt.length === 0) {
        return res.status(204).send();
      }

      res.setHeader('Content-Type', 'application/x-protobuf');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(mvt);

    } catch (error) {
      console.error('Erreur MVT:', error);
      res.status(500).send();
    }
  }

  // ─────────────────────────────────────────────
  // MVT temporaire — shp_temp
  // GET /tiles/temp/:session_id/:z/:x/:y.pbf
  // ─────────────────────────────────────────────
  @Get('temp/:session_id/:z/:x/:y.pbf')
  async getTileTemp(
    @Param('session_id') sessionId: string,
    @Param('z') z: string,
    @Param('x') x: string,
    @Param('y') y: string,
    @Res() res: Response,
  ) {
    try {
      const zoom = parseInt(z, 10);
      const tileX = parseInt(x, 10);
      const tileY = parseInt(y, 10);

      const query = `
        SELECT ST_AsMVT(tile, 'shp_layer', 4096, 'geom') AS mvt
        FROM (
          SELECT
            id,
            qualite,
            ST_AsMVTGeom(
              ST_QuantizeCoordinates(geom, 4),
              ST_TileEnvelope($1, $2, $3),
              4096, 64, true
            ) AS geom
          FROM shp_temp
          WHERE session_id = $4
          AND geom && ST_TileEnvelope($1, $2, $3)
        ) AS tile
        WHERE geom IS NOT NULL
      `;

      const result = await pool.query(query, [zoom, tileX, tileY, sessionId]);
      const mvt = result.rows[0]?.mvt;

      if (!mvt || mvt.length === 0) {
        return res.status(204).send();
      }

      res.setHeader('Content-Type', 'application/x-protobuf');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(mvt);

    } catch (error) {
      console.error('Erreur MVT Temp:', error);
      res.status(500).send();
    }
  }
}