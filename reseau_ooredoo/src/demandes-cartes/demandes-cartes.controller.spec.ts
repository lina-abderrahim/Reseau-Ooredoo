import { Test, TestingModule } from '@nestjs/testing';
import { DemandesCarteController } from './demandes-cartes.controller';
import { DemandesCarteService } from './demandes-cartes.service';

describe('DemandesCarteController', () => {
  let controller: DemandesCarteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DemandesCarteController],
      providers: [DemandesCarteService],
    }).compile();

    controller = module.get<DemandesCarteController>(DemandesCarteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});