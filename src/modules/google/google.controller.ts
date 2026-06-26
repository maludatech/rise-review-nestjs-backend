import { BadRequestException, Controller, Get, Query } from '@nestjs/common';

interface GooglePlace {
  displayName?: { text?: string };
  formattedAddress?: string;
  id?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  internationalPhoneNumber?: string;
}

interface GooglePlacesResponse {
  places?: GooglePlace[];
}

// Public endpoint — used during onboarding to look up a business
@Controller('rise-review/google')
export class GoogleController {
  @Get('search')
  async searchBusiness(@Query('query') query: string) {
    if (!query) throw new BadRequestException('query required');

    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACE_API_KEY!,
          'X-Goog-FieldMask':
            'places.displayName,places.formattedAddress,places.id,places.googleMapsUri,places.websiteUri,places.rating,places.userRatingCount,places.internationalPhoneNumber',
        },
        body: JSON.stringify({ textQuery: query }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new BadRequestException(
        `Google API error: ${response.status} - ${text}`,
      );
    }

    const data = (await response.json()) as GooglePlacesResponse;

    const results = (data.places ?? []).map((place) => ({
      name: place.displayName?.text ?? 'Unknown',
      address: place.formattedAddress ?? 'No address',
      placeId: place.id,
      url:
        place.googleMapsUri ??
        `https://www.google.com/maps/place/?q=place_id:${place.id}`,
      website: place.websiteUri ?? null,
      rating: place.rating ?? null,
      userRatingsTotal: place.userRatingCount ?? 0,
      internationalPhone: place.internationalPhoneNumber ?? null,
    }));

    return { success: true, data: results };
  }
}
