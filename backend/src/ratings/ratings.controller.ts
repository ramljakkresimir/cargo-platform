import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { RatingsService } from './ratings.service';
import { RateUserDto } from './dto/rate-user.dto';
import { RatingSummariesDto } from './dto/rating-summaries.dto';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  // POST /ratings — submit a rating for another user, or update the caller's
  // existing rating for them (see RatingsService.submitOrUpdate())
  @Post()
  @UseGuards(JwtAuthGuard)
  submit(@Request() req: AuthenticatedRequest, @Body() dto: RateUserDto) {
    return this.ratingsService.submitOrUpdate(req.user.id, dto);
  }

  // POST /ratings/summaries — batched average+count lookup for a page of search
  // result cards, public like GET /cargo-posts and GET /vehicle-posts
  @Post('summaries')
  @HttpCode(HttpStatus.OK)
  async summaries(@Body() dto: RatingSummariesDto) {
    const results = await this.ratingsService.getSummaries(dto.userIds);
    return { results };
  }

  // GET /ratings/user/:userId/summary — single user's average+count, public
  @Get('user/:userId/summary')
  summary(@Param('userId') userId: string) {
    return this.ratingsService.getSummary(userId);
  }

  // GET /ratings/user/:userId/mine — the caller's existing rating for this user, if
  // any, used to pre-fill the rating picker
  @Get('user/:userId/mine')
  @UseGuards(JwtAuthGuard)
  mine(@Request() req: AuthenticatedRequest, @Param('userId') userId: string) {
    return this.ratingsService.getMyRatingFor(req.user.id, userId);
  }
}
