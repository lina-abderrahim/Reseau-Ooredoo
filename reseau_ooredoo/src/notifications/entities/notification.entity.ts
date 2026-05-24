import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titre: string;

  @Column()
  message: string;

  @Column()
  type: string;

  @Column({ default: false })
  lu: boolean;

  @Column()
  user_id: number;

  @CreateDateColumn()
  created_at: Date;
}