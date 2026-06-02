import { Injectable } from '@nestjs/common';

type TwilioSafeListResponse = {
  sid?: string;
  status?: string;
  message?: string;
  code?: number;
};

@Injectable()
export class TwilioService {
  async addToSafeList(phone: string): Promise<TwilioSafeListResponse> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      'base64',
    );

    const res = await fetch('https://accounts.twilio.com/v1/SafeList/Numbers', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ PhoneNumber: phone }).toString(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Twilio SafeList failed: ${error}`);
    }

    return (await res.json()) as TwilioSafeListResponse;
  }
}
