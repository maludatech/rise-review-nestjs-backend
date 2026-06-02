import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async generateCampaignMessage(params: {
    firstName: string;
    businessName: string;
    tone?: string;
    language?: string;
    retries?: number;
  }): Promise<string> {
    const {
      firstName,
      businessName,
      tone,
      language = 'en',
      retries = 3,
    } = params;

    const languageName = LANGUAGE_NAMES[language] ?? LANGUAGE_NAMES.en;

    const toneDescription = tone?.trim()
      ? `${tone} tone`
      : 'friendly, warm tone';

    const prompt = `
Write a short review request message in ${languageName}
with a ${toneDescription}
for a customer named ${firstName}
from ${businessName}.

Keep it under 100 words.

Do not include any links or URLs.
Those will be added separately.

Write only the message.
No subject line.
No greeting label.
`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `
You are a friendly business assistant writing
review request messages for customers.

Always write in ${languageName}.

Keep messages:
- warm
- natural
- concise
- under 100 words
`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const message = completion.choices[0].message.content?.trim();

        if (message) {
          return message;
        }
      } catch (error) {
        this.logger.warn(
          `GPT attempt ${attempt}/${retries} failed`,
          error instanceof Error ? error.message : String(error),
        );

        if (attempt === retries) {
          return `Hi ${firstName}, we hope you enjoyed your experience at ${businessName}! We'd love it if you could leave us a quick review. It means a lot to us. Thank you!`;
        }
      }
    }

    return `Hi ${firstName}, we hope you enjoyed your experience at ${businessName}! We'd love to hear your feedback.`;
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

      return res.choices[0].message?.content ?? '';
    } catch {
      if (review.rating >= 4) return 'Thank you for your kind feedback!';
      if (review.rating === 3) return 'Thanks for your feedback!';
      return "We're sorry about your experience.";
    }
  }
}
