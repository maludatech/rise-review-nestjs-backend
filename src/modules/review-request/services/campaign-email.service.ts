import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import React from 'react';
import { render } from '@react-email/render';
import CampaignEmail from '../../../../emails/CampaignEmail';

@Injectable()
export class CampaignEmailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY ?? '');

  async sendCampaignEmail(params: {
    businessName: string;
    customerEmail: string;
    customerName: string;
    senderName: string;
    replyToEmail: string;
    positiveUrl: string;
    negativeUrl: string;
  }) {
    const html = await render(
      React.createElement(CampaignEmail, {
        businessName: params.businessName,
        reviewLink: params.positiveUrl,
        negativeUrl: params.negativeUrl,
        customerName: params.customerName,
        senderName: params.senderName,
        replyToEmail: params.replyToEmail,
      }),
    );

    return this.resend.emails.send({
      from: `${params.businessName} <campaigns@risereview.io>`,
      to: params.customerEmail,
      subject: `Quick question from ${params.businessName}`,
      html,
      replyTo: params.replyToEmail,
    });
  }
}
