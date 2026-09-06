import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  OneToMany 
} from 'typeorm';
import { ServiceTechnology } from '../../service-technologies/entities/service-technology.entity';

@Entity('technologies')
export class Technology {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nom_technologie: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => ServiceTechnology, (st) => st.technology, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  serviceTechnologies: ServiceTechnology[];
}