export interface WhatsAppUser {
  twilioIntegration?: {
    subaccountSid?: string;
    whatsapp?: {
      connected?: boolean;
      phoneNumber?: string;
      phoneNumberSid?: string;
      wabaId?: string;
    };
  };
}
