import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CartesCouverture } from '../../cartes-couverture/entities/cartes-couverture.entity';
import { Exclude } from 'class-transformer';

@Entity('polygones')
export class Polygone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  coordinates: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  qualite: string;

  @Exclude()
  @ManyToOne(() => CartesCouverture, (carte) => carte.polygones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'carte_id' })
  carte: CartesCouverture;
}