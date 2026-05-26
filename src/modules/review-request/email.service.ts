import { Resend } from 'resend';
import React from 'react';
import { render } from '@react-email/render';
import CampaignEmail from '../../../emails/CampaignEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  async sendReviewEmail(data: {
    to: string;
    businessName: string;
    customerName: string;
    senderName: string;
    replyToEmail: string;
    positiveUrl: string;
    negativeUrl: string;
  }) {
    const html = await render(
      React.createElement(CampaignEmail, {
        businessName: data.businessName,
        reviewLink: data.positiveUrl,
        negativeUrl: data.negativeUrl,
        customerName: data.customerName,
        senderName: data.senderName,
        replyToEmail: data.replyToEmail,
      }),
    );

    await resend.emails.send({
      from: `${data.businessName} <campaigns@risereview.io>`,
      to: data.to,
      subject: `How was your visit to ${data.businessName}?`,
      html,
      replyTo: data.replyToEmail,
    });
  }
}
