import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'app_user' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: true, unique: true })
  email!: string | null;

  @Column({ name: 'display_name', type: 'text', nullable: true })
  displayName!: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'text', default: 'en' })
  locale!: string;

  @Column({ type: 'text', default: 'system' })
  theme!: string;

  @Column({ name: 'home_country', type: 'char', length: 2, nullable: true })
  homeCountry!: string | null;

  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ type: 'text', default: 'user' })
  role!: 'user' | 'admin' | 'staff';

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
