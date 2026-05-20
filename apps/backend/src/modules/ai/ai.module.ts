import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ConversationService } from './conversation.service';
import { ConversationalAiService } from './conversational-ai.service';
import { PlacesModule } from '../places/places.module';
import { RoutesModule } from '../routes/routes.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AiConversationEntity, AiMessageEntity } from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiConversationEntity, AiMessageEntity]),
    PlacesModule,
    RoutesModule,
    RealtimeModule,
  ],
  controllers: [AiController],
  providers: [AiService, ConversationService, ConversationalAiService],
  exports: [AiService, ConversationalAiService],
})
export class AiModule {}
