import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

@Injectable()
export class AiService {
  async generateMessage(firstName: string, tone?: string) {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Write short friendly review request messages under 100 words.',
        },
        {
          role: 'user',
          content: `Write a ${tone ?? 'friendly'} message for ${firstName}`,
        },
      ],
    });

    return res.choices[0].message?.content ?? '';
  }

  async generateCampaignMessage(params: {
    firstName: string;
    businessName: string;
    tone?: string;
  }) {
    const prompt = params.tone
      ? `Write a short ${params.tone} review request message for ${params.firstName} from ${params.businessName}. Keep it under 100 words.`
      : `Write a short friendly review request message for ${params.firstName} from ${params.businessName}. Keep it under 100 words.`;

    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You write concise, natural customer review request messages.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return res.choices[0].message?.content ?? '';
  }

  async generateReviewResponse(review: { comment?: string; rating: number }) {
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a business owner replying to customer reviews. Keep it under 100 words, polite and professional.',
          },
          {
            role: 'user',
            content: `Review: "${review.comment || 'No comment'}" | Rating: ${review.rating}/5`,
          },
        ],
      });

      return res.choices[0].message?.content || '';
    } catch {
      if (review.rating >= 4) {
        return 'Thank you for your kind feedback! We appreciate your support.';
      }
      if (review.rating === 3) {
        return "Thanks for your feedback! We're always improving.";
      }
      return "We're sorry about your experience. We'll work to do better.";
    }
  }
}
