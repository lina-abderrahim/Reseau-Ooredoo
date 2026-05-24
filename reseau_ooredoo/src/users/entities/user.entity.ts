import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CartesCouverture } from '../../cartes-couverture/entities/cartes-couverture.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column({ default: 'ingenieur' })
  role: string;

  // ✅ Flag pour forcer le changement de mot de passe
  @Column({ default: false })
  must_change_password: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CartesCouverture, (carte) => carte.user)
  cartes: CartesCouverture[];
}