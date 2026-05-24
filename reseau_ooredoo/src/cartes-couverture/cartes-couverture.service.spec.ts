import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DemandesCarteService } from '../demandes-cartes/demandes-cartes.service';
import { Demande } from '../demandes-cartes/entities/demandes-carte.entity';
 // Vérifie bien ce chemin

describe('DemandesCarteService', () => {
  let service: DemandesCarteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemandesCarteService,
        {
          provide: getRepositoryToken(Demande), // <-- Utilise bien 'Demande' ici
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DemandesCarteService>(DemandesCarteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});