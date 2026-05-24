import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany, 
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { ServiceTechnology } from '../../service-technologies/entities/service-technology.entity';
import { Polygone } from '../../polygons/entities/polygon.entity';
import { User } from '../../users/entities/user.entity';

@Entity('cartes_couverture')
export class CartesCouverture {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  statut: string;

  // ✅ Commentaire de refus
  @Column({ type: 'text', nullable: true })
  commentaire_refus: string;

  // ✅ Type du commentaire : 'note' ou 'rapport'
  @Column({ type: 'varchar', length: 50, nullable: true })
  type_commentaire: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.cartes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ServiceTechnology, (st) => st.cartes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_technologie_id' })
  service_technologie: ServiceTechnology;

  @OneToMany(() => Polygone, (polygone) => polygone.carte, { cascade: true })
  polygones: Polygone[];
}