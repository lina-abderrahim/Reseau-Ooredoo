import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  OneToMany 
} from 'typeorm';
import { ServiceTechnology } from '../../service-technologies/entities/service-technology.entity';

@Entity('services')
export class Service {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nom_service: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => ServiceTechnology, (st) => st.service, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  serviceTechnologies: ServiceTechnology[];
}