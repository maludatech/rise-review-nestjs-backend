import { Twilio } from 'twilio';

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
}
