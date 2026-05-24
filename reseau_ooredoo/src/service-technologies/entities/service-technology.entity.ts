import { 
  Entity, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  OneToMany, 
  JoinColumn 
} from 'typeorm';

import { Technology } from '../../technologies/entities/technology.entity';
import { Service } from '../../services/entities/service.entity';
import { CartesCouverture } from '../../cartes-couverture/entities/cartes-couverture.entity';

@Entity('service_technologies')
export class ServiceTechnology {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Technology, (tech) => tech.serviceTechnologies)
  @JoinColumn({ name: 'technology_id' })
  technology: Technology;

  @ManyToOne(() => Service, (service) => service.serviceTechnologies)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @OneToMany(() => CartesCouverture, (carte) => carte.service_technologie)
  cartes: CartesCouverture[];
}