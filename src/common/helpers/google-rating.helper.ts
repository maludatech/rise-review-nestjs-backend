import axios from 'axios';

type FindPlaceResponse = {
  candidates?: {
    place_id?: string;
    name?: string;
  }[];
};

type PlaceDetailsResponse = {
  result?: {
    rating?: number;
    user_ratings_total?: number;
  };
};

export const fetchGoogleRating = async (
  businessName: string,
  city: string,
): Promise<{
  googleRating: number | null;
  totalReviews: number | null;
  googlePlaceId: string | null;
} | null> => {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ Missing GOOGLE_API_KEY');
    return null;
  }

  try {
    const query = `${businessName} ${city}`;

    // Step 1
    const findResponse = await axios.get<FindPlaceResponse>(
      'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
      {
        params: {
          input: query,
          inputtype: 'textquery',
          fields: 'place_id,name',
          key: apiKey,
        },
      },
    );

    const candidate = findResponse.data?.candidates?.[0];

    if (!candidate?.place_id) {
      console.warn(`⚠️ No Google Place found for: ${query}`);
      return null;
    }

    // Step 2
    const detailsResponse = await axios.get<PlaceDetailsResponse>(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: candidate.place_id,
          fields: 'rating,user_ratings_total',
          key: apiKey,
        },
      },
    );

    const details = detailsResponse.data.result;

    return {
      googleRating: details?.rating ?? null,
      totalReviews: details?.user_ratings_total ?? null,
      googlePlaceId: candidate.place_id,
    };
  } catch (error) {
    console.error('❌ Error fetching Google rating:', error);
    return null;
  }
};
