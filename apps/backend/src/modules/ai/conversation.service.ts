import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversationEntity, AiMessageEntity } from '../../database/entities';

export interface PersistedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Server-side AI memory.
 *
 *   • `findOrCreate({ userId | clientId })` returns the most-recent
 *     conversation row, or creates a new one.
 *   • `getHistory(id, limit)` returns the trailing N messages in order.
 *   • `append(id, role, content)` appends a new message and bumps the
 *     conversation's updated_at so it stays "current".
 *
 * Cap memory at MAX_MESSAGES per conversation; older messages stay in
 * the DB for audit but aren't sent back to Claude.
 */
const MAX_MESSAGES = 20;

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(AiConversationEntity)
    private readonly convos: Repository<AiConversationEntity>,
    @InjectRepository(AiMessageEntity)
    private readonly msgs: Repository<AiMessageEntity>,
  ) {}

  async findOrCreate(input: {
    userId?: string | null;
    clientId?: string | null;
  }): Promise<AiConversationEntity> {
    if (input.userId) {
      const existing = await this.convos.findOne({
        where: { userId: input.userId },
        order: { updatedAt: 'DESC' },
      });
      if (existing) return existing;
    } else if (input.clientId) {
      const existing = await this.convos.findOne({
        where: { clientId: input.clientId },
        order: { updatedAt: 'DESC' },
      });
      if (existing) return existing;
    }
    return this.convos.save(
      this.convos.create({
        userId: input.userId ?? null,
        clientId: input.clientId ?? null,
      }),
    );
  }

  async getHistory(conversationId: string, limit = MAX_MESSAGES): Promise<PersistedMessage[]> {
    const rows = await this.msgs.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.reverse().map((r) => ({ role: r.role, content: r.content }));
  }

  async append(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
  ): Promise<void> {
    await this.msgs.save(this.msgs.create({ conversationId, role, content }));
    await this.convos.update({ id: conversationId }, { updatedAt: new Date() });
  }
}
