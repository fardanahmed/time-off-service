import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  status: string; // 'SUCCESS' | 'FAILED'

  @Column({ nullable: true })
  recordsProcessed: number;

  @CreateDateColumn()
  executedAt: Date;
}
