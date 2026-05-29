export type TwilioIntegration = {
  subaccountSid?: string;
  whatsapp?: {
    connected?: boolean;
    phoneNumber?: string;
    phoneNumberSid?: string;
    wabaId?: string;
  };
};
