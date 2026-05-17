import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'fare' })
export class FareEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'agency_id', type: 'text', nullable: true })
  agencyId!: string | null;

  @Column({ name: 'country_code', type: 'char', length: 2, nullable: true })
  countryCode!: string | null;

  @Column({ type: 'text' })
  type!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: string;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'text' })
  source!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'booking_url', type: 'text', nullable: true })
  bookingUrl!: string | null;

  @Column({ name: 'valid_from', type: 'date', nullable: true })
  validFrom!: string | null;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil!: string | null;
}
