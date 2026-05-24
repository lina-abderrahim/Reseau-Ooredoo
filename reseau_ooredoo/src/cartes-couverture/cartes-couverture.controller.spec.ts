import { Test, TestingModule } from '@nestjs/testing';
import { CartesCouvertureController } from './cartes-couverture.controller';
import { CartesCouvertureService } from './cartes-couverture.service';

describe('CartesCouvertureController', () => {
  let controller: CartesCouvertureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartesCouvertureController],
      providers: [CartesCouvertureService],
    }).compile();

    controller = module.get<CartesCouvertureController>(CartesCouvertureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
