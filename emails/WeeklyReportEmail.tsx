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

interface WeeklyReportEmailProps {
  name?: string;
  businessName?: string;
  period?: string;
  totalReviews?: number;
  averageRating?: number;
  newReviewsCount?: number;
  topPositiveReview?: {
    reviewerName: string;
    rating: number;
    text: string;
    platform: string;
  };
  topNegativeReview?: {
    reviewerName: string;
    rating: number;
    text: string;
    platform: string;
  };
  dashboardUrl?: string;
}

const currentYear = new Date().getFullYear();
const BRAND = '#ea2069';
const BRAND_MUTED = 'rgba(234,32,105,0.12)';

const starRating = (rating: number): string =>
  '★'.repeat(Math.floor(rating)) +
  (rating % 1 >= 0.5 ? '½' : '') +
  '☆'.repeat(5 - Math.ceil(rating));

export default function WeeklyReportEmail({
  name = 'there',
  businessName = 'your business',
  period = 'this week',
  totalReviews = 48,
  averageRating = 4.7,
  newReviewsCount = 12,
  topPositiveReview,
  topNegativeReview,
  dashboardUrl = 'https://app.risereview.io/dashboard',
}: WeeklyReportEmailProps) {
  const firstName = name.split(' ')[0];

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
            .stat-card-plain { background-color: #1a1a1f !important; border-color: rgba(255,255,255,0.07) !important; }
            .review-positive { background-color: #1a1f1a !important; border-color: rgba(74,222,128,0.25) !important; }
            .review-negative { background-color: #1f1a14 !important; border-color: rgba(251,146,60,0.25) !important; }
            .email-footer { background-color: #0d0d0f !important; border-top-color: rgba(255,255,255,0.06) !important; }
            .text-primary { color: #f9fafb !important; }
            .text-secondary { color: #9ca3af !important; }
            .text-muted { color: #6b7280 !important; }
            .divider { border-color: rgba(255,255,255,0.07) !important; }
          }
        `}</style>
      </Head>
      <Preview>{`Weekly summary for ${businessName} · ${newReviewsCount} new reviews · ${averageRating.toFixed(1)}★ avg`}</Preview>

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
                      WEEKLY REPORT
                    </Text>
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
                  margin: '0 0 6px 0',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  lineHeight: '1.2',
                }}
              >
                Weekly summary for{' '}
                <span style={{ color: BRAND }}>{businessName}</span>.
              </Heading>
              <Text
                className="text-muted"
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '13px',
                  color: '#9ca3af',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.02em',
                }}
              >
                {period.toUpperCase()}
              </Text>

              {/* ── Stats grid ── */}
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ width: '100%', marginBottom: '20px' }}
              >
                <tr>
                  {/* Big avg rating */}
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
                        Avg Rating
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
                        {averageRating.toFixed(1)}
                      </Text>
                      <Text
                        style={{
                          margin: '6px 0 0 0',
                          fontSize: '16px',
                          letterSpacing: '2px',
                          color: BRAND,
                        }}
                      >
                        {starRating(averageRating)}
                      </Text>
                    </div>
                  </td>

                  {/* Right column: new + total */}
                  <td style={{ verticalAlign: 'top' }} width="42%">
                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      border={0}
                      style={{ width: '100%' }}
                    >
                      <tr>
                        <td style={{ paddingBottom: '10px' }}>
                          <div
                            className="stat-card-plain"
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
                              New Reviews
                            </Text>
                            <Text
                              className="text-primary"
                              style={{
                                margin: '0',
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#0f172a',
                                letterSpacing: '-0.03em',
                                lineHeight: '1',
                              }}
                            >
                              {newReviewsCount}
                            </Text>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div
                            style={{
                              backgroundColor: 'rgba(234,32,105,0.08)',
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
                              Total
                            </Text>
                            <Text
                              style={{
                                margin: '0',
                                fontSize: '20px',
                                fontWeight: '700',
                                color: BRAND,
                                letterSpacing: '-0.02em',
                                lineHeight: '1',
                              }}
                            >
                              {totalReviews}
                            </Text>
                            <Text
                              style={{
                                margin: '4px 0 0 0',
                                fontSize: '11px',
                                color: BRAND,
                                opacity: 0.7,
                              }}
                            >
                              all time
                            </Text>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              {/* ── Top positive review ── */}
              {topPositiveReview && (
                <div
                  className="review-positive"
                  style={{
                    backgroundColor: 'rgba(240,253,244,1)',
                    borderRadius: '14px',
                    border: '1px solid rgba(34,197,94,0.2)',
                    padding: '18px 20px',
                    marginBottom: '12px',
                  }}
                >
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    style={{ marginBottom: '12px' }}
                  >
                    <tr>
                      <td>
                        <div
                          style={{
                            display: 'inline-block',
                            backgroundColor: 'rgba(34,197,94,0.12)',
                            borderRadius: '6px',
                            padding: '3px 10px',
                          }}
                        >
                          <Text
                            style={{
                              margin: '0',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#16a34a',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontFamily: "'DM Mono', monospace",
                            }}
                          >
                            ★ Best of the week · {topPositiveReview.platform}
                          </Text>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <Text
                    className="text-primary"
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: '15px',
                      lineHeight: '1.65',
                      color: '#1e293b',
                      fontStyle: 'italic',
                    }}
                  >
                    "{topPositiveReview.text}"
                  </Text>
                  <Text
                    className="text-secondary"
                    style={{
                      margin: '0',
                      fontSize: '13px',
                      color: '#64748b',
                      fontWeight: '500',
                    }}
                  >
                    — {topPositiveReview.reviewerName}
                  </Text>
                </div>
              )}

              {/* ── Top negative review ── */}
              {topNegativeReview && (
                <div
                  className="review-negative"
                  style={{
                    backgroundColor: 'rgba(255,247,237,1)',
                    borderRadius: '14px',
                    border: '1px solid rgba(251,146,60,0.2)',
                    padding: '18px 20px',
                    marginBottom: '20px',
                  }}
                >
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    style={{ marginBottom: '12px' }}
                  >
                    <tr>
                      <td>
                        <div
                          style={{
                            display: 'inline-block',
                            backgroundColor: 'rgba(251,146,60,0.12)',
                            borderRadius: '6px',
                            padding: '3px 10px',
                          }}
                        >
                          <Text
                            style={{
                              margin: '0',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#ea580c',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontFamily: "'DM Mono', monospace",
                            }}
                          >
                            ⚠ Needs response · {topNegativeReview.platform}
                          </Text>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <Text
                    className="text-primary"
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: '15px',
                      lineHeight: '1.65',
                      color: '#1e293b',
                      fontStyle: 'italic',
                    }}
                  >
                    "{topNegativeReview.text}"
                  </Text>
                  <Text
                    className="text-secondary"
                    style={{
                      margin: '0',
                      fontSize: '13px',
                      color: '#64748b',
                      fontWeight: '500',
                    }}
                  >
                    — {topNegativeReview.reviewerName}
                  </Text>
                </div>
              )}

              {/* ── CTA ── */}
              <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                <Button
                  href={dashboardUrl}
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
                  View Full Report →
                </Button>
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

WeeklyReportEmail.PreviewProps = {
  name: 'Laura Chen',
  businessName: 'La Bella Café',
  period: 'December 29, 2025 – January 4, 2026',
  totalReviews: 156,
  averageRating: 4.8,
  newReviewsCount: 14,
  topPositiveReview: {
    reviewerName: 'Sophie L.',
    rating: 5,
    text: 'Absolutely love this place! Best latte art and super friendly staff.',
    platform: 'Google',
  },
  topNegativeReview: {
    reviewerName: 'Mark T.',
    rating: 2,
    text: 'Waited 20 minutes for a coffee. Needs better staffing.',
    platform: 'Google',
  },
  dashboardUrl: 'https://app.risereview.io/dashboard',
} as WeeklyReportEmailProps;
