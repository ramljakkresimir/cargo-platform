import { Injectable } from '@nestjs/common';
import { OpenRouteService, Coordinate } from './openroute.service';

export interface RouteResult {
  coordinates: Coordinate[];
}

@Injectable()
export class RoutingService {
  constructor(private readonly openRouteService: OpenRouteService) {}

  async getRoute(
    origin: Coordinate,
    destination: Coordinate,
  ): Promise<RouteResult | null> {
    const coordinates = await this.openRouteService.getRoute(origin, destination);
    if (!coordinates) return null;
    return { coordinates };
  }
}
