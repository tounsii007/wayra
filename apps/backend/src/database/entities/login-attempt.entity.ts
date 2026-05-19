import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'login_attempt' })
@Index('login_attempt_email_idx', ['email', 'attemptedAt'])
export class LoginAttemptEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ type: 'text' })
  email!: string;

  @Column({ type: 'inet', nullable: true })
  ip!: string | null;

  @Column({ type: 'boolean' })
  success!: boolean;

  @Column({ name: 'attempted_at', type: 'timestamptz', default: () => 'now()' })
  attemptedAt!: Date;
}
