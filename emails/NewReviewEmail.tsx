import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Img,
  Heading,
  Text,
  Hr,
  Button,
} from '@react-email/components';

interface NewReviewEmailProps {
  name?: string;
  businessName?: string;
  rating?: number;
  reviewerName?: string;
  reviewText?: string;
  platform?: string;
  reviewUrl?: string;
}

const currentYear = new Date().getFullYear();
const BRAND = '#ea2069';
const BRAND_MUTED = 'rgba(234,32,105,0.12)';

const starRating = (rating: number): string =>
  '★'.repeat(Math.floor(rating)) +
  (rating % 1 >= 0.5 ? '½' : '') +
  '☆'.repeat(5 - Math.ceil(rating));

const ratingTier = (rating: number) => {
  if (rating >= 4)
    return {
      bg: 'rgba(34,197,94,0.1)',
      border: 'rgba(34,197,94,0.2)',
      text: '#16a34a',
      label: 'Positive',
    };
  if (rating === 3)
    return {
      bg: 'rgba(234,179,8,0.1)',
      border: 'rgba(234,179,8,0.2)',
      text: '#ca8a04',
      label: 'Neutral',
    };
  return {
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.2)',
    text: '#ef4444',
    label: 'Critical',
  };
};

export default function NewReviewEmail({
  name = 'there',
  businessName = 'your business',
  rating = 5,
  reviewerName = 'A customer',
  reviewText = '',
  platform = 'Google',
  reviewUrl,
}: NewReviewEmailProps) {
  const firstName = name.split(' ')[0];
  const tier = ratingTier(rating);

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

          @media (prefers-color-scheme: dark) {
            .email-body { background-color: #0d0d0f !important; }
            .email-card { background-color: #141416 !important; border-color: rgba(255,255,255,0.08) !important; }
            .email-header { background-color: #1a1a1f !important; border-bottom-color: rgba(255,255,255,0.06) !important; }
            .stat-card { background-color: #1e1e26 !important; border-color: rgba(234,32,105,0.2) !important; }
            .review-card { background-color: #1a1a1f !important; border-color: rgba(255,255,255,0.08) !important; }
            .email-footer { background-color: #0d0d0f !important; border-top-color: rgba(255,255,255,0.06) !important; }
            .text-primary { color: #f9fafb !important; }
            .text-secondary { color: #9ca3af !important; }
            .text-muted { color: #6b7280 !important; }
            .divider { border-color: rgba(255,255,255,0.07) !important; }
          }
        `}</style>
      </Head>
      <Preview>{`New ${rating}★ review on ${platform} for ${businessName}`}</Preview>

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
                  {/* Logo + name */}
                  <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      border={0}
                    >
                      <tr>
                        <td
                          style={{
                            verticalAlign: 'middle',
                            width: '36px',
                            height: '36px',
                            backgroundColor: BRAND,
                            borderRadius: '10px',
                            textAlign: 'center',
                            padding: '0',
                          }}
                        >
                          <Img
                            src="https://res.cloudinary.com/dlnvweuhv/image/upload/v1765648905/rise-review-icon.png"
                            alt="Rise Review"
                            width="20"
                            height="20"
                            style={{ display: 'block', margin: '8px' }}
                          />
                        </td>
                        <td
                          style={{
                            verticalAlign: 'middle',
                            paddingLeft: '10px',
                          }}
                        >
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
                            Rise Review
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </td>
                  {/* Rating tier pill */}
                  <td
                    style={{
                      verticalAlign: 'middle',
                      textAlign: 'right',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-block',
                        backgroundColor: tier.bg,
                        borderRadius: '6px',
                        padding: '4px 10px',
                      }}
                    >
                      <Text
                        style={{
                          margin: '0',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: tier.text,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        ★ {tier.label}
                      </Text>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '36px 28px 28px' }}>
              {/* Greeting */}
              <Text
                className="text-secondary"
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  color: '#6b7280',
                }}
              >
                Hello, {firstName} —
              </Text>
              <Heading
                className="text-primary"
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  lineHeight: '1.2',
                }}
              >
                A new review just came in
                <br />
                for <span style={{ color: BRAND }}>{businessName}</span>.
              </Heading>

              {/* ── Stats grid ── */}
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ width: '100%', marginBottom: '20px' }}
              >
                <tr>
                  {/* Big rating */}
                  <td
                    style={{ paddingRight: '10px', verticalAlign: 'top' }}
                    width="58%"
                  >
                    <div
                      className="stat-card"
                      style={{
                        backgroundColor: BRAND_MUTED,
                        borderRadius: '14px',
                        border: '1px solid rgba(234,32,105,0.15)',
                        padding: '20px 20px 18px',
                      }}
                    >
                      <Text
                        className="text-muted"
                        style={{
                          margin: '0 0 6px 0',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#9ca3af',
                          fontWeight: '600',
                        }}
                      >
                        Rating
                      </Text>
                      <Text
                        style={{
                          margin: '0',
                          fontSize: '52px',
                          fontWeight: '700',
                          color: BRAND,
                          letterSpacing: '-0.04em',
                          lineHeight: '1',
                        }}
                      >
                        {rating}.0
                      </Text>
                      <Text
                        style={{
                          margin: '6px 0 0 0',
                          fontSize: '16px',
                          letterSpacing: '2px',
                          color: BRAND,
                        }}
                      >
                        {starRating(rating)}
                      </Text>
                    </div>
                  </td>

                  {/* Right column */}
                  <td style={{ verticalAlign: 'top' }} width="42%">
                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      border={0}
                      style={{ width: '100%' }}
                    >
                      {/* Platform */}
                      <tr>
                        <td style={{ paddingBottom: '10px' }}>
                          <div
                            className="stat-card"
                            style={{
                              backgroundColor: '#f8fafc',
                              borderRadius: '14px',
                              border: '1px solid rgba(0,0,0,0.07)',
                              padding: '14px 16px',
                            }}
                          >
                            <Text
                              className="text-muted"
                              style={{
                                margin: '0 0 4px 0',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#9ca3af',
                                fontWeight: '600',
                              }}
                            >
                              Platform
                            </Text>
                            <Text
                              className="text-primary"
                              style={{
                                margin: '0',
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#0f172a',
                                letterSpacing: '-0.02em',
                                lineHeight: '1',
                              }}
                            >
                              {platform}
                            </Text>
                          </div>
                        </td>
                      </tr>
                      {/* Reviewer */}
                      <tr>
                        <td>
                          <div
                            style={{
                              backgroundColor: tier.bg,
                              borderRadius: '14px',
                              padding: '14px 16px',
                            }}
                          >
                            <Text
                              className="text-muted"
                              style={{
                                margin: '0 0 4px 0',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#9ca3af',
                                fontWeight: '600',
                              }}
                            >
                              Reviewer
                            </Text>
                            <Text
                              style={{
                                margin: '0',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: tier.text,
                                letterSpacing: '-0.01em',
                                lineHeight: '1.2',
                              }}
                            >
                              {reviewerName}
                            </Text>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              {/* ── Review card ── */}
              <div
                className="review-card"
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '14px',
                  border: '1px solid rgba(0,0,0,0.07)',
                  padding: '18px 20px',
                  marginBottom: '24px',
                }}
              >
                <Text
                  className="text-muted"
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  Review · {platform}
                </Text>
                {reviewText ? (
                  <Text
                    className="text-primary"
                    style={{
                      margin: '0',
                      fontSize: '15px',
                      color: '#1e293b',
                      lineHeight: '1.65',
                      fontStyle: 'italic',
                    }}
                  >
                    "{reviewText}"
                  </Text>
                ) : (
                  <Text
                    className="text-muted"
                    style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#9ca3af',
                      fontStyle: 'italic',
                    }}
                  >
                    No written comment left.
                  </Text>
                )}
              </div>

              {/* ── CTA ── */}
              <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                {reviewUrl ? (
                  <Button
                    href={reviewUrl}
                    style={{
                      backgroundColor: BRAND,
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      padding: '13px 28px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      display: 'inline-block',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    View on {platform} →
                  </Button>
                ) : (
                  <Button
                    href="https://app.risereview.io/dashboard"
                    style={{
                      backgroundColor: BRAND,
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      padding: '13px 28px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      display: 'inline-block',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Open Dashboard →
                  </Button>
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
                Responding to reviews increases trust and visibility.
                <br />
                Keep up the great work.
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
                      © {currentYear} Rise Review
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
                      Automated · Do not reply
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

NewReviewEmail.PreviewProps = {
  name: 'Laura Chen',
  businessName: 'La Bella Café',
  rating: 5,
  reviewerName: 'Marco R.',
  reviewText:
    'Best coffee in town! The staff is always friendly and the atmosphere is perfect for working.',
  platform: 'Google',
  reviewUrl: 'https://g.page/r/example/review',
} as NewReviewEmailProps;
