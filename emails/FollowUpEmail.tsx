import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Link,
  Hr,
  Img,
} from "@react-email/components";

interface FollowUpEmailProps {
  businessName?: string;
  city?: string;
  unsubscribeUrl?: string;
}

const currentYear = new Date().getFullYear();
const BRAND = "#ea2069";

export default function FollowUpEmail({
  businessName = "there",
  city = "your area",
  unsubscribeUrl = "#",
}: FollowUpEmailProps) {
  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

          @media (prefers-color-scheme: dark) {
            .email-body { background-color: #0d0d0f !important; }
            .email-card { background-color: #141416 !important; border-color: rgba(255,255,255,0.08) !important; }
            .email-header { background-color: #1a1a1f !important; border-bottom-color: rgba(255,255,255,0.06) !important; }
            .highlight-card { background-color: #1e1e26 !important; border-color: rgba(234,32,105,0.2) !important; }
            .email-footer { background-color: #0d0d0f !important; border-top-color: rgba(255,255,255,0.06) !important; }
            .text-primary { color: #f9fafb !important; }
            .text-secondary { color: #9ca3af !important; }
            .text-muted { color: #6b7280 !important; }
            .divider { border-color: rgba(255,255,255,0.07) !important; }
          }
        `}</style>
      </Head>
      <Preview>
        Quick follow-up from Rise Review — still thinking about you.
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
                      FOLLOW-UP
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
                  margin: "0 0 20px 0",
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                  lineHeight: "1.2",
                }}
              >
                Just following up on
                <br />
                our last email to you.
              </Text>

              <Text
                className="text-secondary"
                style={{
                  margin: "0 0 20px 0",
                  fontSize: "15px",
                  lineHeight: "1.75",
                  color: "#4b5563",
                }}
              >
                We'd love to show you how Rise Review helps businesses like
                yours in <strong style={{ color: "#0f172a" }}>{city}</strong>{" "}
                collect more reviews, improve visibility, and build lasting
                customer trust.
              </Text>

              <Text
                className="text-secondary"
                style={{
                  margin: "0 0 32px 0",
                  fontSize: "15px",
                  lineHeight: "1.75",
                  color: "#4b5563",
                }}
              >
                Any questions? Just reply to this email — we're happy to help.
              </Text>

              {/* ── Value highlight card ── */}
              <div
                className="highlight-card"
                style={{
                  backgroundColor: "rgba(234,32,105,0.07)",
                  borderRadius: "14px",
                  border: "1px solid rgba(234,32,105,0.15)",
                  padding: "20px 22px",
                  marginBottom: "32px",
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
                    <td style={{ verticalAlign: "top", paddingRight: "20px" }}>
                      <Text
                        style={{
                          margin: "0 0 2px 0",
                          fontSize: "22px",
                          fontWeight: "700",
                          color: BRAND,
                          letterSpacing: "-0.03em",
                          lineHeight: "1",
                        }}
                      >
                        More reviews.
                      </Text>
                      <Text
                        className="text-muted"
                        style={{
                          margin: "0",
                          fontSize: "12px",
                          color: "#9ca3af",
                          fontFamily: "'DM Mono', monospace",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Better visibility
                      </Text>
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        borderLeft: "1px solid rgba(234,32,105,0.15)",
                        paddingLeft: "20px",
                      }}
                    >
                      <Text
                        style={{
                          margin: "0 0 2px 0",
                          fontSize: "22px",
                          fontWeight: "700",
                          color: BRAND,
                          letterSpacing: "-0.03em",
                          lineHeight: "1",
                        }}
                      >
                        Less effort.
                      </Text>
                      <Text
                        className="text-muted"
                        style={{
                          margin: "0",
                          fontSize: "12px",
                          color: "#9ca3af",
                          fontFamily: "'DM Mono', monospace",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Automated outreach
                      </Text>
                    </td>
                  </tr>
                </table>
              </div>

              {/* Signature */}
              <Text
                className="text-primary"
                style={{
                  margin: "0",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  color: "#374151",
                }}
              >
                Best,
                <br />
                <strong style={{ color: "#0f172a" }}>
                  The Rise Review Team
                </strong>
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
                  lineHeight: "1.6",
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

FollowUpEmail.PreviewProps = {
  businessName: "La Bella Café",
  city: "San Francisco",
  unsubscribeUrl: "https://app.risereview.io/unsubscribe",
} as FollowUpEmailProps;
