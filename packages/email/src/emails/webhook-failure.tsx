import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  pixelBasedPreset,
  Row,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { EmailButton } from "../components/button";
import { EmailFooter } from "../components/footer";
import { EMAIL_CONFIG } from "../lib/config";

export interface WebhookFailureEmailProps {
  workspaceName: string;
  endpointName: string;
  endpointUrl: string;
  dashboardUrl: string;
  stage: "warning" | "disabled";
  consecutiveFailures: number;
  failureStartedAt: Date;
  latestStatusCode: number | null;
  latestError: string | null;
  disableGraceDays: number;
}

function displayEndpointUrl(endpointUrl: string): string {
  try {
    const url = new URL(endpointUrl);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "View endpoint URL in your webhook settings";
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function plural(count: number, word: string): string {
  return `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;
}

export const WebhookFailureEmail = ({
  workspaceName,
  endpointName,
  endpointUrl,
  dashboardUrl,
  stage,
  consecutiveFailures,
  failureStartedAt,
  latestStatusCode,
  disableGraceDays,
}: WebhookFailureEmailProps) => {
  const disabled = stage === "disabled";
  const heading = disabled
    ? "We've disabled a webhook endpoint"
    : "A webhook endpoint is failing";
  const previewText = disabled
    ? `Delivery to ${endpointName} is paused. Fix and re-enable it in your webhook settings.`
    : `Check ${endpointName}: repeated webhook delivery failures in ${workspaceName}.`;
  const details = [
    ["Endpoint", displayEndpointUrl(endpointUrl)],
    [
      "Last response",
      latestStatusCode === null ? "No response" : `HTTP ${latestStatusCode}`,
    ],
    [
      "Failing since",
      `${formatDate(failureStartedAt)} (${plural(consecutiveFailures, "failed attempt")})`,
    ],
  ] as const;

  return (
    <Html lang="en">
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Head />
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="mx-auto my-[40px] max-w-[480px] p-[20px]">
            <Section className="mt-[16px] mb-[24px]">
              <Img
                alt="Marble Logo"
                height="36"
                src={`${EMAIL_CONFIG.getAppUrl()}/logo.png`}
                width="36"
              />
            </Section>

            <Heading className="m-0 mb-4 font-semibold text-black text-xl">
              {heading}
            </Heading>

            <Text className="m-0 mb-4 text-[#404040] text-[15px] leading-relaxed">
              {disabled ? (
                <>
                  <strong>{endpointName}</strong> kept failing after our
                  warning, so we've paused delivery to it.
                </>
              ) : (
                <>
                  Deliveries to <strong>{endpointName}</strong> have repeatedly
                  failed. If this continues for{" "}
                  {plural(disableGraceDays, "day")}, we'll disable the endpoint
                  automatically.
                </>
              )}
            </Text>

            <Section className="my-6 rounded border border-[#eaeaea] border-solid px-4 py-2">
              {details.map(([label, value], index) => (
                <Row
                  key={label}
                  style={
                    index > 0 ? { borderTop: "1px solid #eaeaea" } : undefined
                  }
                >
                  <Column
                    className="py-3 align-top text-[#737373] text-sm"
                    style={{ width: 110 }}
                  >
                    {label}
                  </Column>
                  <Column
                    className="py-3 align-top text-black text-sm"
                    style={{ overflowWrap: "anywhere", wordBreak: "break-all" }}
                  >
                    {value}
                  </Column>
                </Row>
              ))}
            </Section>

            <Text className="m-0 mb-2 font-semibold text-base text-black">
              What to do next
            </Text>
            <Text className="m-0 text-[#404040] text-sm leading-relaxed">
              • Check that the URL is reachable
              <br />• Return a 2xx status when you accept a webhook
              <br />• Review your server logs for errors
              {disabled && (
                <>
                  <br />• Re-enable the endpoint from your dashboard
                </>
              )}
            </Text>

            <Section className="my-8">
              <EmailButton
                className="box-border w-full text-center"
                href={dashboardUrl}
              >
                Manage webhook
              </EmailButton>
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

WebhookFailureEmail.PreviewProps = {
  workspaceName: "Marble",
  endpointName: "Production updates",
  endpointUrl: "https://example.com/api/webhooks",
  dashboardUrl:
    "https://app.marblecms.com/marble/settings/webhooks/production-updates",
  stage: "warning",
  consecutiveFailures: 10,
  failureStartedAt: new Date("2026-10-13T10:00:00.000Z"),
  latestStatusCode: 400,
  latestError: '{"error":"Malformed body"}',
  disableGraceDays: 3,
} satisfies WebhookFailureEmailProps;

export default WebhookFailureEmail;
