import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ConversationsService } from './conversations.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

// All conversation/message endpoints require a valid JWT — there is no public or
// admin-only messaging surface.
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // GET /conversations — the "Razgovori" list page
  @Get()
  list(@Request() req: AuthenticatedRequest) {
    return this.conversationsService.list(req.user.id);
  }

  // GET /conversations/unread-count — navbar badge
  @Get('unread-count')
  async unreadCount(@Request() req: AuthenticatedRequest) {
    const count = await this.conversationsService.getUnreadCount(req.user.id);
    return { count };
  }

  // POST /conversations — find-or-create the thread with a listing's owner (the
  // "Contact" button flow)
  @Post()
  start(
    @Request() req: AuthenticatedRequest,
    @Body() dto: StartConversationDto,
  ) {
    return this.conversationsService.startOrGet(req.user.id, dto);
  }

  // GET /conversations/:id/messages — full history; also marks the other
  // participant's messages as read (see ConversationsService.getMessages())
  @Get(':id/messages')
  getMessages(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.conversationsService.getMessages(id, req.user.id);
  }

  // POST /conversations/:id/messages — send a message into an existing thread
  @Post(':id/messages')
  sendMessage(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(id, req.user.id, dto);
  }
}
