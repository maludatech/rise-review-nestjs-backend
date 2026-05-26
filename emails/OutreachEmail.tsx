import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Button,
  Hr,
  Link,
  Img,
} from "@react-email/components";

interface OutreachEmailProps {
  businessName?: string;
  googleRating?: string;
  landingUrl?: string;
  unsubscribeUrl?: string;
}

const currentYear = new Date().getFullYear();
const BRAND = "#ea2069";

export default function OutreachEmail({
  businessName = "there",
  googleRating = "4.5",
  landingUrl = "https://app.risereview.io",
  unsubscribeUrl = "#",
}: OutreachEmailProps) {
  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

          @media (prefers-color-scheme: dark) {
            .email-body { background-color: #0d0d0f !important; }
            .email-card { background-color: #141416 !important; border-color: rgba(255,255,255,0.08) !important; }
            .email-header { background-color: #1a1a1f !important; border-bottom-color: rgba(255,255,255,0.06) !important; }
            .rating-card { background-color: #1e1e26 !important; border-color: rgba(234,32,105,0.2) !important; }
            .feature-card { background-color: #1a1a1f !important; border-color: rgba(255,255,255,0.07) !important; }
            .email-footer { background-color: #0d0d0f !important; border-top-color: rgba(255,255,255,0.06) !important; }
            .text-primary { color: #f9fafb !important; }
            .text-secondary { color: #9ca3af !important; }
            .text-muted { color: #6b7280 !important; }
            .divider { border-color: rgba(255,255,255,0.07) !important; }
          }
        `}</style>
      </Head>
      <Preview>
        Your {googleRating}★ rating could be even higher — here's how.
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
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
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
                        fontSize: "11px",
                        color: "#9ca3af",
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.02em",
                      }}
                    >
                      OUTREACH
                    </Text>
                  </td>
                </tr>
              </table>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "40px 28px 32px" }}>
              {/* Greeting */}
              <Text
                className="text-secondary"
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                Hi {businessName} —
              </Text>

              <Text
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
                Your {googleRating}★ rating is great.
                <br />
                <span style={{ color: BRAND }}>Let's make it exceptional.</span>
              </Text>

              <Text
                className="text-secondary"
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "15px",
                  lineHeight: "1.75",
                  color: "#4b5563",
                }}
              >
                We found your business on Google and noticed you're already
                doing well. With{" "}
                <strong style={{ color: "#0f172a" }}>Rise Review</strong>,
                businesses like yours collect more positive reviews on autopilot
                — bringing in more customers and climbing the rankings.
              </Text>

              {/* ── Rating + feature card ── */}
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ width: "100%", marginBottom: "28px" }}
              >
                <tr>
                  {/* Current rating */}
                  <td
                    style={{ paddingRight: "10px", verticalAlign: "top" }}
                    width="42%"
                  >
                    <div
                      className="rating-card"
                      style={{
                        backgroundColor: "rgba(234,32,105,0.07)",
                        borderRadius: "14px",
                        border: "1px solid rgba(234,32,105,0.15)",
                        padding: "18px 18px 16px",
                        textAlign: "center",
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
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        Your Rating
                      </Text>
                      <Text
                        style={{
                          margin: "0",
                          fontSize: "44px",
                          fontWeight: "700",
                          color: BRAND,
                          letterSpacing: "-0.04em",
                          lineHeight: "1",
                        }}
                      >
                        {googleRating}
                      </Text>
                      <Text
                        style={{
                          margin: "6px 0 0 0",
                          fontSize: "16px",
                          color: BRAND,
                          letterSpacing: "2px",
                        }}
                      >
                        ★★★★★
                      </Text>
                      <Text
                        className="text-muted"
                        style={{
                          margin: "8px 0 0 0",
                          fontSize: "11px",
                          color: "#9ca3af",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        Google
                      </Text>
                    </div>
                  </td>

                  {/* Features */}
                  <td style={{ verticalAlign: "top" }} width="58%">
                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      border={0}
                      style={{ width: "100%" }}
                    >
                      {[
                        {
                          label: "Auto review requests",
                          sub: "Sent after each visit",
                        },
                        { label: "Multi-platform", sub: "Google, Yelp & more" },
                        {
                          label: "Real-time alerts",
                          sub: "For every new review",
                        },
                      ].map((f, i) => (
                        <tr key={i}>
                          <td style={{ paddingBottom: i < 2 ? "8px" : "0" }}>
                            <div
                              className="feature-card"
                              style={{
                                backgroundColor: "#f8fafc",
                                borderRadius: "10px",
                                border: "1px solid rgba(0,0,0,0.06)",
                                padding: "10px 14px",
                              }}
                            >
                              <Text
                                className="text-primary"
                                style={{
                                  margin: "0",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#0f172a",
                                  lineHeight: "1.3",
                                }}
                              >
                                {f.label}
                              </Text>
                              <Text
                                className="text-muted"
                                style={{
                                  margin: "2px 0 0 0",
                                  fontSize: "11px",
                                  color: "#9ca3af",
                                  fontFamily: "'DM Mono', monospace",
                                }}
                              >
                                {f.sub}
                              </Text>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </table>
                  </td>
                </tr>
              </table>

              {/* ── CTA ── */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <Button
                  href={landingUrl}
                  style={{
                    backgroundColor: BRAND,
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    padding: "13px 32px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    display: "inline-block",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Get Started Today →
                </Button>
              </div>

              <Text
                className="text-muted"
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  textAlign: "center",
                  margin: "0",
                }}
              >
                Or visit:{" "}
                <Link
                  href={landingUrl}
                  style={{ color: BRAND, textDecoration: "none" }}
                >
                  {landingUrl}
                </Link>
              </Text>

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
                  fontSize: "12px",
                  color: "#9ca3af",
                  textAlign: "center",
                  margin: "0",
                }}
              >
                <Link
                  href={unsubscribeUrl}
                  style={{ color: "#9ca3af", textDecoration: "underline" }}
                >
                  Unsubscribe from future emails
                </Link>
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
                      All rights reserved
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

OutreachEmail.PreviewProps = {
  businessName: "La Bella Café",
  googleRating: "4.5",
  landingUrl: "https://app.risereview.io",
  unsubscribeUrl: "https://app.risereview.io/unsubscribe",
} as OutreachEmailProps;
