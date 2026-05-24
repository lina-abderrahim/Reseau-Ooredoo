import { Test, TestingModule } from '@nestjs/testing';
import { ServiceTechnologiesController } from './service-technologies.controller';
import { ServiceTechnologiesService } from './service-technologies.service';

describe('ServiceTechnologiesController', () => {
  let controller: ServiceTechnologiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceTechnologiesController],
      providers: [ServiceTechnologiesService],
    }).compile();

    controller = module.get<ServiceTechnologiesController>(ServiceTechnologiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
