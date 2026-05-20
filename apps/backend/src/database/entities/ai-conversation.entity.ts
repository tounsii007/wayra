import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ai_conversation' })
@Index('ai_conversation_user_idx', ['userId', 'updatedAt'])
@Index('ai_conversation_client_idx', ['clientId', 'updatedAt'])
export class AiConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'client_id', type: 'text', nullable: true })
  clientId!: string | null;

  @Column({ type: 'text', nullable: true })
  title!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}
