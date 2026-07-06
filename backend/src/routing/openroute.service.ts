import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface Coordinate {
  lat: number;
  lng: number;
}

@Injectable()
export class OpenRouteService {
  private readonly logger = new Logger(OpenRouteService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENROUTESERVICE_API_KEY') || '';
  }

  async getRoute(
    origin: Coordinate,
    destination: Coordinate,
  ): Promise<Coordinate[] | null> {
    if (!this.apiKey) {
      this.logger.warn('OPENROUTESERVICE_API_KEY not set — skipping route fetch');
      return null;
    }

    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.post(
          'https://api.openrouteservice.org/v2/directions/driving-hgv/geojson',
          {
            coordinates: [
              [origin.lng, origin.lat],
              [destination.lng, destination.lat],
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 20_000,
          },
        );

        const coords: [number, number, number][] =
          response.data?.features?.[0]?.geometry?.coordinates;

        if (!coords || coords.length < 2) {
          this.logger.warn('ORS returned empty route');
          return null;
        }

        // ORS returns [lng, lat, elevation] — convert to { lat, lng }
        return coords.map(([lng, lat]) => ({ lat, lng }));
      } catch (err: any) {
        this.logger.warn(`ORS route fetch failed (attempt ${attempt}/${maxAttempts}): ${err?.message ?? err}`);
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    return null;
  }
}
