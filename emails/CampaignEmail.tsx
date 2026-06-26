import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Img,
  Button,
} from '@react-email/components';

interface CampaignEmailProps {
  businessName?: string;
  reviewLink?: string;
  negativeUrl?: string;
  customerName?: string;
  senderName?: string;
  replyToEmail?: string;
  logoUrl?: string;
}

const currentYear = new Date().getFullYear();
const BRAND = '#ea2069';

export default function CampaignEmail({
  businessName = 'your business',
  reviewLink = '#',
  negativeUrl,
  customerName,
  senderName,
  replyToEmail,
  logoUrl,
}: CampaignEmailProps) {
  const sender = senderName ?? `The ${businessName} Team`;
  const greeting = customerName ? `Hello, ${customerName} —` : 'Hello —';

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

          @media (prefers-color-scheme: dark) {
            .email-body { background-color: #0d0d0f !important; }
            .email-card { background-color: #141416 !important; border-color: rgba(255,255,255,0.08) !important; }
            .email-header { background-color: #1a1a1f !important; border-bottom-color: rgba(255,255,255,0.06) !important; }
            .star-card { background-color: #1e1e26 !important; border-color: rgba(234,32,105,0.2) !important; }
            .email-footer { background-color: #0d0d0f !important; border-top-color: rgba(255,255,255,0.06) !important; }
            .text-primary { color: #f9fafb !important; }
            .text-secondary { color: #9ca3af !important; }
            .text-muted { color: #6b7280 !important; }
            .divider { border-color: rgba(255,255,255,0.07) !important; }
            .sender-block { background-color: #1a1a1f !important; border-color: rgba(255,255,255,0.06) !important; }
            .negative-btn { background-color: #1e1e26 !important; color: #e5e7eb !important; border-color: rgba(255,255,255,0.1) !important; }
          }
        `}</style>
      </Head>
      <Preview>
        How was your experience with {businessName}? We'd love to hear from you.
      </Preview>

      <Body
        className="email-body"
        style={{
          backgroundColor: '#f1f1f5',
          fontFamily:
            "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          margin: '0',
          padding: '32px 16px',
        }}
      >
        <Container style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div
            className="email-card"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid rgba(0,0,0,0.07)',
              overflow: 'hidden',
              boxShadow:
                '0 1px 3px rgba(0,0,0,0.05), 0 20px 50px rgba(0,0,0,0.08)',
            }}
          >
            {/* ── Header ── */}
            <div
              className="email-header"
              style={{
                backgroundColor: '#fafafa',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                padding: '20px 28px',
              }}
            >
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ width: '100%' }}
              >
                <tr>
                  <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {logoUrl ? (
                      <Img
                        src={logoUrl}
                        alt={businessName}
                        height="32"
                        style={{ display: 'block' }}
                      />
                    ) : (
                      <Text
                        className="text-primary"
                        style={{
                          margin: '0',
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#111827',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {businessName}
                      </Text>
                    )}
                  </td>
                  <td
                    style={{
                      verticalAlign: 'middle',
                      textAlign: 'right',
                      width: '100%',
                    }}
                  >
                    <Text
                      className="text-muted"
                      style={{
                        margin: '0',
                        fontSize: '11px',
                        color: '#9ca3af',
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: '0.02em',
                      }}
                    >
                      {negativeUrl ? 'REVIEW REQUEST' : 'CAMPAIGN'}
                    </Text>
                  </td>
                </tr>
              </table>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '40px 28px 32px' }}>
              {/* Greeting */}
              <Text
                className="text-secondary"
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  color: '#6b7280',
                }}
              >
                {greeting}
              </Text>
              <Heading
                className="text-primary"
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  lineHeight: '1.2',
                }}
              >
                How was your experience
                <br />
                with <span style={{ color: BRAND }}>{businessName}</span>?
              </Heading>

              <Text
                className="text-secondary"
                style={{
                  margin: '0 0 32px 0',
                  fontSize: '15px',
                  lineHeight: '1.7',
                  color: '#4b5563',
                }}
              >
                {negativeUrl
                  ? `Thank you for choosing us. Tap below to let us know how your visit went — it only takes a second.`
                  : `Thank you for choosing us. If you enjoyed your visit, a quick review would mean the world to us — it only takes a minute and helps others discover ${businessName}.`}
              </Text>

              {/* ── Star prompt card ── */}
              <div
                className="star-card"
                style={{
                  backgroundColor: 'rgba(234,32,105,0.07)',
                  borderRadius: '16px',
                  border: '1px solid rgba(234,32,105,0.15)',
                  padding: '28px 24px',
                  textAlign: 'center',
                  marginBottom: '32px',
                }}
              >
                <Text
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '36px',
                    letterSpacing: '6px',
                    lineHeight: '1',
                  }}
                >
                  ★★★★★
                </Text>
                <Text
                  className="text-muted"
                  style={{
                    margin: '12px 0 20px 0',
                    fontSize: '13px',
                    color: '#9ca3af',
                    fontFamily: "'DM Mono', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Share your experience
                </Text>

                {negativeUrl ? (
                  // ── Funnel mode: two buttons ──────────────────────────
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    style={{ margin: '0 auto' }}
                  >
                    <tr>
                      <td style={{ paddingRight: '10px' }}>
                        <Button
                          href={reviewLink}
                          style={{
                            backgroundColor: BRAND,
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '13px 24px',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            display: 'inline-block',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          😊 Great experience
                        </Button>
                      </td>
                      <td>
                        <Button
                          href={negativeUrl}
                          className="negative-btn"
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#374151',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '13px 24px',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            display: 'inline-block',
                            letterSpacing: '-0.01em',
                            border: '1px solid rgba(0,0,0,0.08)',
                          }}
                        >
                          😞 Not so great
                        </Button>
                      </td>
                    </tr>
                  </table>
                ) : (
                  // ── Campaign mode: single CTA ─────────────────────────
                  <Button
                    href={reviewLink}
                    style={{
                      backgroundColor: BRAND,
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      padding: '13px 32px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      display: 'inline-block',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Leave a Review →
                  </Button>
                )}
              </div>

              {/* ── Sender block ── */}
              <div
                className="sender-block"
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  padding: '16px 20px',
                }}
              >
                <Text
                  className="text-muted"
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '11px',
                    color: '#9ca3af',
                    fontFamily: "'DM Mono', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  From
                </Text>
                <Text
                  className="text-primary"
                  style={{
                    margin: '0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#0f172a',
                  }}
                >
                  {sender}
                </Text>
                {replyToEmail && (
                  <Text style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                    <a
                      href={`mailto:${replyToEmail}`}
                      style={{ color: BRAND, textDecoration: 'none' }}
                    >
                      {replyToEmail}
                    </a>
                  </Text>
                )}
              </div>

              <Hr
                className="divider"
                style={{
                  borderColor: 'rgba(0,0,0,0.07)',
                  margin: '28px 0 20px',
                }}
              />

              <Text
                className="text-muted"
                style={{
                  fontSize: '13px',
                  color: '#9ca3af',
                  textAlign: 'center',
                  margin: '0',
                  lineHeight: '1.6',
                }}
              >
                {negativeUrl
                  ? `Your honest feedback helps us improve and helps others find a great experience.`
                  : `Your feedback helps us improve and helps others find a great experience.`}
              </Text>
            </div>

            {/* ── Footer ── */}
            <div
              className="email-footer"
              style={{
                backgroundColor: '#f8fafc',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                padding: '16px 28px',
              }}
            >
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ width: '100%' }}
              >
                <tr>
                  <td>
                    <Text
                      className="text-muted"
                      style={{
                        margin: '0',
                        fontSize: '11px',
                        color: '#9ca3af',
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      © {currentYear} {businessName}
                    </Text>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Text
                      className="text-muted"
                      style={{
                        margin: '0',
                        fontSize: '11px',
                        color: '#9ca3af',
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      You recently visited us
                    </Text>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </Container>
      </Body>
    </Html>
  );
}

CampaignEmail.PreviewProps = {
  businessName: 'La Bella Café',
  customerName: 'Sarah',
  reviewLink: 'https://g.page/r/labella-cafe/review',
  negativeUrl: 'https://app.risereview.io/feedback?token=preview',
  senderName: 'La Bella Café Team',
  replyToEmail: 'hello@labellacafe.com',
  logoUrl:
    'https://res.cloudinary.com/dlnvweuhv/image/upload/v1765648905/rise-review-icon.png',
} as CampaignEmailProps;
