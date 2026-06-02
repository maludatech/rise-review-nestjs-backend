export type TwilioIntegration = {
  subaccountSid?: string;
  messagingServiceSid?: string;
  whatsapp?: {
    connected?: boolean;
    phoneNumber?: string;
    phoneNumberSid?: string;
    wabaId?: string;
    connectedAt?: string;
  };
};
