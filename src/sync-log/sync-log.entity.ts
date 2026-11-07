import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum SyncStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  IN_PROGRESS = 'IN_PROGRESS',
}

@Entity('sync_logs')
export class SyncLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    enum: SyncStatus,
    default: SyncStatus.IN_PROGRESS,
  })
  status: SyncStatus;

  @Column({ nullable: true })
  details?: string;

  @CreateDateColumn()
  createdAt: Date;
}
