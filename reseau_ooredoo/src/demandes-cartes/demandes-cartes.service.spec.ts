import { Test, TestingModule } from '@nestjs/testing';
import { DemandesCarteService } from './demandes-cartes.service';

describe('DemandesCarteService', () => {
  let service: DemandesCarteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemandesCarteService],
    }).compile();

    service = module.get<DemandesCarteService>(DemandesCarteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
