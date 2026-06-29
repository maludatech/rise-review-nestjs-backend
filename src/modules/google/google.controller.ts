import { BadRequestException, Controller, Get, Query } from '@nestjs/common';

interface FindPlaceResponse {
  candidates?: {
    place_id?: string;
    name?: string;
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    rating?: number;
    user_ratings_total?: number;
    website?: string;
    international_phone_number?: string;
  }[];
  status?: string;
}

// Public endpoint — used during onboarding to look up a business
// Uses classic Places API (findplacefromtext) — no billing required
@Controller('rise-review/google')
export class GoogleController {
  @Get('search')
  async searchBusiness(@Query('query') query: string) {
    if (!query) throw new BadRequestException('query required');

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new BadRequestException('Google API key not configured');

    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
    );
    url.searchParams.set('input', query);
    url.searchParams.set('inputtype', 'textquery');
    // Basic fields only — no billing required
    url.searchParams.set('fields', 'place_id,name,formatted_address,geometry');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const text = await response.text();
      throw new BadRequestException(`Google API error: ${response.status} - ${text}`);
    }

    const data = (await response.json()) as FindPlaceResponse;

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new BadRequestException(`Google API status: ${data.status}`);
    }

    const results = (data.candidates ?? []).map((place) => ({
      name: place.name ?? 'Unknown',
      address: place.formatted_address ?? 'No address',
      placeId: place.place_id,
      url: place.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
        : null,
    }));

    return { success: true, data: results };
  }
}
