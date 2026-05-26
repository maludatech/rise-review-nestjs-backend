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
  Section,
} from "@react-email/components";

interface DailyPerformanceReportEmailProps {
  name?: string;
  businessName?: string;
  date?: string;
  newReviewsToday?: number;
  averageRatingToday?: number;
  changeFromYesterday?: number;
  topNewReview?: {
    reviewerName: string;
    rating: number;
    text: string;
    platform: string;
  };
  dashboardUrl?: string;
}

const currentYear = new Date().getFullYear();
const BRAND = "#ea2069";
const BRAND_MUTED = "rgba(234,32,105,0.12)";

const starRating = (rating: number): string =>
  "★".repeat(Math.floor(rating)) +
  (rating % 1 >= 0.5 ? "½" : "") +
  "☆".repeat(5 - Math.ceil(rating));

const ratingChange = (change?: number): string => {
  if (!change || change === 0) return "No change from yesterday";
  return change > 0
    ? `+${change.toFixed(1)} vs yesterday`
    : `${change.toFixed(1)} vs yesterday`;
};

const changeBadgeStyles = (change?: number) => {
  if (!change || change === 0)
    return { bg: "rgba(107,114,128,0.12)", color: "#9ca3af", symbol: "→" };
  return change > 0
    ? { bg: "rgba(34,197,94,0.12)", color: "#4ade80", symbol: "↑" }
    : { bg: "rgba(239,68,68,0.12)", color: "#f87171", symbol: "↓" };
};

export default function DailyPerformanceReportEmail({
  name = "there",
  businessName = "your business",
  date = "today",
  newReviewsToday = 3,
  averageRatingToday = 4.8,
  changeFromYesterday = 0,
  topNewReview,
  dashboardUrl = "https://app.risereview.io/dashboard",
}: DailyPerformanceReportEmailProps) {
  const badge = changeBadgeStyles(changeFromYesterday);
  const firstName = name.split(" ")[0];

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
            .review-card { background-color: #1a1f1a !important; border-color: rgba(74,222,128,0.25) !important; }
            .review-card-warn { background-color: #1f1a14 !important; border-color: rgba(251,146,60,0.25) !important; }
            .email-footer { background-color: #0d0d0f !important; }
            .text-primary { color: #f9fafb !important; }
            .text-secondary { color: #9ca3af !important; }
            .text-muted { color: #6b7280 !important; }
            .divider { border-color: rgba(255,255,255,0.07) !important; }
            .meta-row { background-color: #1a1a1f !important; border-color: rgba(255,255,255,0.06) !important; }
          }
        `}</style>
      </Head>
      <Preview>
        {`${businessName}: ${newReviewsToday} new ${newReviewsToday === 1 ? "review" : "reviews"} · ${averageRatingToday.toFixed(1)}★ avg · ${date}`}
      </Preview>

      <Body
        className="email-body"
        style={{
          backgroundColor: "#f1f1f5",
          fontFamily:
            "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          margin: "0",
          padding: "32px 16px",
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
          }}
        >
          {/* Card wrapper */}
          <div
            className="email-card"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              border: "1px solid rgba(0,0,0,0.07)",
              overflow: "hidden",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.05), 0 20px 50px rgba(0,0,0,0.08)",
            }}
          >
            {/* ── Header ── */}
            <div
              className="email-header"
              style={{
                backgroundColor: "#fafafa",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                padding: "20px 28px",
                display: "flex",
              }}
            >
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ width: "100%" }}
              >
                <tr>
                  {/* Logo + name — whiteSpace:nowrap keeps it from wrapping/collapsing */}
                  <td style={{ verticalAlign: "middle", whiteSpace: "nowrap" }}>
                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      border={0}
                    >
                      <tr>
                        <td
                          style={{
                            verticalAlign: "middle",
                            width: "36px",
                            height: "36px",
                            backgroundColor: BRAND,
                            borderRadius: "10px",
                            textAlign: "center",
                            padding: "0",
                          }}
                        >
                          <Img
                            src="https://res.cloudinary.com/dlnvweuhv/image/upload/v1765648905/rise-review-icon.png"
                            alt="Rise Review"
                            width="20"
                            height="20"
                            style={{ display: "block", margin: "8px" }}
                          />
                        </td>
                        <td
                          style={{
                            verticalAlign: "middle",
                            paddingLeft: "10px",
                          }}
                        >
                          <Text
                            className="text-primary"
                            style={{
                              margin: "0",
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#111827",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            Rise Review
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </td>
                  {/* Date — width:100% pushes it to fill remaining space */}
                  <td
                    style={{
                      verticalAlign: "middle",
                      textAlign: "right",
                      width: "100%",
                    }}
                  >
                    <Text
                      className="text-muted"
                      style={{
                        margin: "0",
                        fontSize: "12px",
                        color: "#9ca3af",
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {date.toUpperCase()}
                    </Text>
                  </td>
                </tr>
              </table>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "36px 28px 28px" }}>
              {/* Greeting */}
              <Text
                className="text-secondary"
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: "400",
                }}
              >
                Hello, {firstName} —
              </Text>
              <Heading
                className="text-primary"
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                  lineHeight: "1.2",
                }}
              >
                Here's your review
                <br />
                summary for <span style={{ color: BRAND }}>{businessName}</span>
                .
              </Heading>

              {/* ── Stats grid ── */}
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ width: "100%", marginBottom: "20px" }}
              >
                <tr>
                  {/* Big rating */}
                  <td
                    style={{ paddingRight: "10px", verticalAlign: "top" }}
                    width="58%"
                  >
                    <div
                      className="stat-card"
                      style={{
                        backgroundColor: BRAND_MUTED,
                        borderRadius: "14px",
                        border: `1px solid rgba(234,32,105,0.15)`,
                        padding: "20px 20px 18px",
                      }}
                    >
                      <Text
                        className="text-muted"
                        style={{
                          margin: "0 0 6px 0",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "#9ca3af",
                          fontWeight: "600",
                        }}
                      >
                        Avg Rating
                      </Text>
                      <Text
                        style={{
                          margin: "0",
                          fontSize: "52px",
                          fontWeight: "700",
                          color: BRAND,
                          letterSpacing: "-0.04em",
                          lineHeight: "1",
                        }}
                      >
                        {averageRatingToday.toFixed(1)}
                      </Text>
                      <Text
                        style={{
                          margin: "6px 0 0 0",
                          fontSize: "16px",
                          letterSpacing: "2px",
                          color: BRAND,
                        }}
                      >
                        {starRating(averageRatingToday)}
                      </Text>
                    </div>
                  </td>

                  {/* Right column: two mini stats */}
                  <td style={{ verticalAlign: "top" }} width="42%">
                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      border={0}
                      style={{ width: "100%", height: "100%" }}
                    >
                      {/* Reviews count */}
                      <tr>
                        <td style={{ paddingBottom: "10px" }}>
                          <div
                            className="stat-card"
                            style={{
                              backgroundColor: "#f8fafc",
                              borderRadius: "14px",
                              border: "1px solid rgba(0,0,0,0.07)",
                              padding: "14px 16px",
                            }}
                          >
                            <Text
                              className="text-muted"
                              style={{
                                margin: "0 0 4px 0",
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: "#9ca3af",
                                fontWeight: "600",
                              }}
                            >
                              New Reviews
                            </Text>
                            <Text
                              className="text-primary"
                              style={{
                                margin: "0",
                                fontSize: "32px",
                                fontWeight: "700",
                                color: "#0f172a",
                                letterSpacing: "-0.03em",
                                lineHeight: "1",
                              }}
                            >
                              {newReviewsToday}
                            </Text>
                          </div>
                        </td>
                      </tr>
                      {/* Change badge */}
                      <tr>
                        <td>
                          <div
                            style={{
                              backgroundColor: badge.bg,
                              borderRadius: "14px",
                              padding: "14px 16px",
                            }}
                          >
                            <Text
                              className="text-muted"
                              style={{
                                margin: "0 0 4px 0",
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: "#9ca3af",
                                fontWeight: "600",
                              }}
                            >
                              Trend
                            </Text>
                            <Text
                              style={{
                                margin: "0",
                                fontSize: "20px",
                                fontWeight: "700",
                                color: badge.color,
                                letterSpacing: "-0.02em",
                                lineHeight: "1",
                              }}
                            >
                              {badge.symbol}{" "}
                              {!changeFromYesterday || changeFromYesterday === 0
                                ? "Flat"
                                : Math.abs(changeFromYesterday).toFixed(1)}
                            </Text>
                            <Text
                              style={{
                                margin: "4px 0 0 0",
                                fontSize: "11px",
                                color: badge.color,
                                opacity: 0.8,
                              }}
                            >
                              vs yesterday
                            </Text>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              {/* ── Top review ── */}
              {topNewReview && (
                <>
                  <div
                    className={
                      topNewReview.rating >= 4
                        ? "review-card"
                        : "review-card-warn"
                    }
                    style={{
                      backgroundColor:
                        topNewReview.rating >= 4
                          ? "rgba(240,253,244,1)"
                          : "rgba(255,247,237,1)",
                      borderRadius: "14px",
                      border:
                        topNewReview.rating >= 4
                          ? "1px solid rgba(34,197,94,0.2)"
                          : "1px solid rgba(251,146,60,0.2)",
                      padding: "18px 20px",
                      marginBottom: "20px",
                    }}
                  >
                    {/* Platform pill */}
                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      border={0}
                      style={{ marginBottom: "12px" }}
                    >
                      <tr>
                        <td>
                          <div
                            style={{
                              display: "inline-block",
                              backgroundColor:
                                topNewReview.rating >= 4
                                  ? "rgba(34,197,94,0.12)"
                                  : "rgba(251,146,60,0.12)",
                              borderRadius: "6px",
                              padding: "3px 10px",
                            }}
                          >
                            <Text
                              style={{
                                margin: "0",
                                fontSize: "11px",
                                fontWeight: "600",
                                color:
                                  topNewReview.rating >= 4
                                    ? "#16a34a"
                                    : "#ea580c",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                              }}
                            >
                              {topNewReview.rating >= 4 ? "★ " : "⚠ "}
                              {topNewReview.platform}
                            </Text>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <Text
                      className="text-primary"
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "15px",
                        lineHeight: "1.65",
                        color: "#1e293b",
                        fontStyle: "italic",
                      }}
                    >
                      "{topNewReview.text}"
                    </Text>
                    <Text
                      className="text-secondary"
                      style={{
                        margin: "0",
                        fontSize: "13px",
                        color: "#64748b",
                        fontWeight: "500",
                      }}
                    >
                      — {topNewReview.reviewerName}
                    </Text>
                  </div>
                </>
              )}

              {/* ── CTA ── */}
              <div style={{ textAlign: "center", paddingTop: "4px" }}>
                <Button
                  href={dashboardUrl}
                  style={{
                    backgroundColor: BRAND,
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    padding: "13px 28px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    display: "inline-block",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Open Dashboard →
                </Button>
              </div>

              <Hr
                className="divider"
                style={{
                  borderColor: "rgba(0,0,0,0.07)",
                  margin: "28px 0 20px",
                }}
              />

              <Text
                className="text-muted"
                style={{
                  fontSize: "13px",
                  color: "#9ca3af",
                  textAlign: "center",
                  margin: "0",
                  lineHeight: "1.6",
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
                backgroundColor: "#f8fafc",
                borderTop: "1px solid rgba(0,0,0,0.06)",
                padding: "16px 28px",
              }}
            >
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ width: "100%" }}
              >
                <tr>
                  <td>
                    <Text
                      className="text-muted"
                      style={{
                        margin: "0",
                        fontSize: "11px",
                        color: "#9ca3af",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      © {currentYear} Rise Review
                    </Text>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Text
                      className="text-muted"
                      style={{
                        margin: "0",
                        fontSize: "11px",
                        color: "#9ca3af",
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

DailyPerformanceReportEmail.PreviewProps = {
  name: "Laura Chen",
  businessName: "La Bella Café",
  date: "January 4, 2026",
  newReviewsToday: 5,
  averageRatingToday: 4.9,
  changeFromYesterday: 0.2,
  topNewReview: {
    reviewerName: "Alex M.",
    rating: 5,
    text: "Incredible service and the best pastries in town!",
    platform: "Google",
  },
  dashboardUrl: "https://app.risereview.io/dashboard",
} as DailyPerformanceReportEmailProps;
