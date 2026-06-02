import { Injectable, BadRequestException } from '@nestjs/common';
import { Twilio } from 'twilio';
import type { WhatsAppUser } from '../../../common/types/whatsapp.type';

const WHATSAPP_PROPAGATION_HOURS = 12;

@Injectable()
export class WhatsAppService {
  private readonly baseClient: Twilio;

  constructor() {
    this.baseClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  getUserClient(subaccountSid?: string): Twilio {
    return subaccountSid
      ? new Twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
          {
            accountSid: subaccountSid,
          },
        )
      : this.baseClient;
  }

  getWhatsappFrom(user: WhatsAppUser): string | null {
    const whatsapp = user.twilioIntegration?.whatsapp;

    return whatsapp?.connected && whatsapp.phoneNumber
      ? whatsapp.phoneNumber
      : null;
  }

  assertReady(user: WhatsAppUser): void {
    const whatsapp = user.twilioIntegration?.whatsapp;

    if (!whatsapp?.connectedAt) {
      return;
    }

    const connectedAt = new Date(whatsapp.connectedAt);

    const hoursSinceConnected =
      (Date.now() - connectedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceConnected < WHATSAPP_PROPAGATION_HOURS) {
      const remaining = Math.ceil(
        WHATSAPP_PROPAGATION_HOURS - hoursSinceConnected,
      );

      throw new BadRequestException(`WHATSAPP_NOT_READY:${remaining}`);
    }
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
