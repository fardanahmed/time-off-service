import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['employeeId', 'locationId'])
export class TimeOffBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @Column()
  locationId: string;

  @Column('decimal', { precision: 5, scale: 2 })
  balanceDays: number;

  @UpdateDateColumn()
  lastSyncedAt: Date;
}
