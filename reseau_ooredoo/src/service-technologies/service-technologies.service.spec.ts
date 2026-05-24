import { Test, TestingModule } from '@nestjs/testing';
import { ServiceTechnologiesService } from './service-technologies.service';

describe('ServiceTechnologiesService', () => {
  let service: ServiceTechnologiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceTechnologiesService],
    }).compile();

    service = module.get<ServiceTechnologiesService>(ServiceTechnologiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
