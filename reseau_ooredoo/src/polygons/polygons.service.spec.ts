import { Test, TestingModule } from '@nestjs/testing';
import { PolygonsService } from './polygons.service';

describe('PolygonsService', () => {
  let service: PolygonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolygonsService],
    }).compile();

    service = module.get<PolygonsService>(PolygonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
