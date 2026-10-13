import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  pixelBasedPreset,
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

const MAX_ERROR_LENGTH = 1000;

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

export const WebhookFailureEmail = ({
  workspaceName,
  endpointName,
  endpointUrl,
  dashboardUrl,
  stage,
  consecutiveFailures,
  failureStartedAt,
  latestStatusCode,
  latestError,
  disableGraceDays,
}: WebhookFailureEmailProps) => {
  const disabled = stage === "disabled";
  const heading = disabled
    ? "Your webhook has been disabled"
    : "Your webhook deliveries are failing";
  const previewText = disabled
    ? `Delivery to ${endpointName} is paused. Fix and re-enable it in your webhook settings.`
    : `Check ${endpointName}: repeated webhook delivery failures in ${workspaceName}.`;
  const error = latestError?.trim();
  const errorText = error
    ? `${error.slice(0, MAX_ERROR_LENGTH)}${error.length > MAX_ERROR_LENGTH ? "…" : ""}`
    : null;
  const failureCount = consecutiveFailures.toLocaleString("en-US");
  const failureSince = failureStartedAt.toUTCString();
  const gracePeriod = `${disableGraceDays} ${disableGraceDays === 1 ? "day" : "days"}`;

  return (
    <Html lang="en">
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Head />
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Section className="mt-[32px]">
              <Img
                alt="Marble Logo"
                className="mx-auto"
                height="40"
                src={`${EMAIL_CONFIG.getAppUrl()}/logo.png`}
                width="40"
              />
            </Section>

            <Heading className="my-6 text-center font-medium text-2xl text-black">
              {heading}
            </Heading>

            <Text className="m-0 mb-4 text-[#737373] text-base leading-relaxed">
              {disabled ? (
                <>
                  We've automatically disabled <strong>{endpointName}</strong>{" "}
                  in <strong>{workspaceName}</strong> because delivery failures
                  continued after our warning. Delivery to this endpoint is now
                  paused.
                </>
              ) : (
                <>
                  Deliveries to <strong>{endpointName}</strong> in{" "}
                  <strong>{workspaceName}</strong> have repeatedly failed to
                  receive a successful response.
                </>
              )}
            </Text>

            <Section className="my-6 rounded border border-[#eaeaea] border-solid bg-[#f9fafb] p-4">
              <Text className="m-0 mb-2 font-semibold text-black text-sm">
                {disabled ? "Disabled endpoint" : "Affected endpoint"}
              </Text>
              <Text
                className="m-0 mb-4 text-[#737373] text-sm leading-relaxed"
                style={{ overflowWrap: "anywhere", wordBreak: "break-all" }}
              >
                {displayEndpointUrl(endpointUrl)}
              </Text>
              <Text className="m-0 mb-4 text-[#737373] text-sm leading-relaxed">
                {failureCount} consecutive failed{" "}
                {consecutiveFailures === 1 ? "attempt" : "attempts"} since{" "}
                {failureSince}.
              </Text>
              <Text className="m-0 mb-2 font-semibold text-black text-sm">
                {latestStatusCode === null
                  ? "Latest delivery error"
                  : `Latest response: HTTP ${latestStatusCode}`}
              </Text>
              <Text
                className="m-0 text-[#737373] text-sm leading-relaxed"
                style={{
                  overflowWrap: "anywhere",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {errorText ??
                  (latestStatusCode === null
                    ? "No response or error details were recorded. Inspect the delivery in your webhook settings."
                    : "No response body was recorded. Inspect the delivery in your webhook settings.")}
              </Text>
            </Section>

            {disabled ? (
              <>
                <Text className="m-0 mb-4 text-[#737373] text-base leading-relaxed">
                  Review the delivery details and your service logs. Verify that
                  the endpoint is reachable and accepts webhook requests with a
                  2xx response, then test and re-enable it in your webhook
                  settings.
                </Text>
                <Text className="m-0 mb-4 text-[#737373] text-base leading-relaxed">
                  Re-enabling this endpoint does not automatically replay failed
                  events.
                </Text>
              </>
            ) : (
              <>
                <Text className="m-0 mb-4 text-[#737373] text-base leading-relaxed">
                  This endpoint is still enabled. New events and retries that
                  remain scheduled can continue to be delivered. If failures
                  continue for {gracePeriod} after this warning, we'll
                  automatically disable the endpoint and notify you again.
                </Text>
                <Text className="m-0 mb-4 text-[#737373] text-base leading-relaxed">
                  Review the delivery details and your service logs. Check that
                  the endpoint is reachable and returns a 2xx response when it
                  accepts a webhook.
                </Text>
              </>
            )}

            <Section className="my-8 text-center">
              <EmailButton className="box-border" href={dashboardUrl}>
                Manage webhook
              </EmailButton>
            </Section>
            <Text className="mb-6 text-[#666666] text-xs leading-relaxed">
              Need help understanding a delivery failure?{" "}
              <Link
                className="text-[#766df8] no-underline"
                href={`mailto:${EMAIL_CONFIG.replyTo}`}
              >
                Contact support
              </Link>
              .
            </Text>
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
