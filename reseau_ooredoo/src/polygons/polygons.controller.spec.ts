import { Test, TestingModule } from '@nestjs/testing';
import { PolygonsController } from './polygons.controller';
import { PolygonsService } from './polygons.service';

describe('PolygonsController', () => {
  let controller: PolygonsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolygonsController],
      providers: [PolygonsService],
    }).compile();

    controller = module.get<PolygonsController>(PolygonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
