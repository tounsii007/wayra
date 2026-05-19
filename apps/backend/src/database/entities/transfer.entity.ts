import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'transfer' })
export class TransferEntity {
  @PrimaryColumn({ name: 'from_stop_id', type: 'text' })
  fromStopId!: string;

  @PrimaryColumn({ name: 'to_stop_id', type: 'text' })
  toStopId!: string;

  /** 0=recommended, 1=timed, 2=min_time, 3=not_possible */
  @Column({ name: 'transfer_type', type: 'smallint' })
  transferType!: 0 | 1 | 2 | 3;

  @Column({ name: 'min_transfer_time', type: 'int', nullable: true })
  minTransferTime!: number | null;
}
