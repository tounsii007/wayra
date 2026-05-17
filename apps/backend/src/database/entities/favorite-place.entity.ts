import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'favorite_place' })
export class FavoritePlaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  kind!: string;

  @Column({ type: 'text', nullable: true })
  label!: string | null;

  @Column({ name: 'place_id', type: 'text', nullable: true })
  placeId!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
