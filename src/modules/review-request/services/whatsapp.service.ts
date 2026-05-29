import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import type { WhatsAppUser } from '../../../common/types/whatsapp.type';

@Injectable()
export class WhatsAppService {
  private baseClient: Twilio;

  constructor() {
    this.baseClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  getUserClient(subaccountSid?: string) {
    return subaccountSid
      ? new Twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
          { accountSid: subaccountSid },
        )
      : this.baseClient;
  }

  getWhatsappFrom(user: WhatsAppUser): string | null {
    const w = user.twilioIntegration?.whatsapp;

    return w?.connected && w?.phoneNumber ? w.phoneNumber : null;
  }

  async sendMessage(params: {
    user: WhatsAppUser;
    to: string;
    from: string;
    body: string;
  }) {
    const client = this.getUserClient(
      params.user.twilioIntegration?.subaccountSid,
    );

    return client.messages.create({
      body: params.body,
      from: `whatsapp:${params.from}`,
      to: `whatsapp:${params.to}`,
    });
  }
}
