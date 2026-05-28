import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import React from 'react';
import { render } from '@react-email/render';

@Injectable()
export class EmailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendEmail(input: {
    to: string | string[];
    subject: string;
    reactComponent: React.ReactElement;
    from?: string;
  }) {
    const html = await render(input.reactComponent);

    await this.resend.emails.send({
      from: input.from ?? 'Rise Review <notifications@risereview.io>',
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html,
    });
  }
}
