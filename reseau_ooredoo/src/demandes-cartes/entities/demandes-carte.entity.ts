import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('demandes_cartes')
export class Demande {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  technologie: string;

  @Column()
  service: string;

  @Column({ type: 'json', nullable: true })
  qualites: string[];

  @Column({ type: 'json', nullable: true })
  polygones: any[];

  @Column({ default: 'en_attente' })
  statut: string;

  @Column()
  ingenieur_id: number;

  @Column()
  ingenieur_nom: string;

  @Column()
  ingenieur_email: string;

  @Column({ nullable: true })
  commentaire_admin: string;

  @Column({ nullable: true })
  carte_id: number; // ✅ champ ajouté

  @CreateDateColumn()
  date_creation: Date;

  @UpdateDateColumn()
  date_modification: Date;
}