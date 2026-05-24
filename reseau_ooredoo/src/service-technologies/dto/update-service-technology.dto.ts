import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceTechnologyDto } from './create-service-technology.dto';

export class UpdateServiceTechnologyDto extends PartialType(CreateServiceTechnologyDto) {}
