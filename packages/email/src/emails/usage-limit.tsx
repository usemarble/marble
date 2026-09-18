import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { EmailButton } from "../components/button";
import { EmailFooter } from "../components/footer";
import { EMAIL_CONFIG } from "../lib/config";

interface UsageLimitEmailProps {
  userName?: string;
  featureName?: string;
  usageAmount?: number;
  limitAmount?: number;
  workspaceId?: string;
  /**
   * Whether the workspace has a plan it can move up to. False on the top plan,
   * where telling someone to upgrade is a dead end.
   */
  canUpgrade?: boolean;
  /** When the limit resets - the one fact a blocked customer actually needs. */
  resetsAt?: Date | string;
}

function formatResetDate(resetsAt?: Date | string): string | null {
  if (!resetsAt) {
    return null;
  }
  const date = resetsAt instanceof Date ? resetsAt : new Date(resetsAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  // Fixed to UTC so the date cannot shift with the sending server's timezone.
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  });
}

/**
 * Lowercases a feature name for use mid-sentence, leaving acronyms alone so
 * "API Requests" reads as "API requests" rather than "api requests".
 */
function toMidSentence(name: string): string {
  return name
    .split(" ")
    .map((word) => (word === word.toUpperCase() ? word : word.toLowerCase()))
    .join(" ");
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export const UsageLimitEmail = ({
  userName,
  featureName = "Webhooks",
  usageAmount = 75,
  limitAmount = 100,
  canUpgrade = true,
  resetsAt,
}: UsageLimitEmailProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();
  const siteurl = EMAIL_CONFIG.getSiteUrl();
  const billingUrl = `${siteurl}/pricing`;

  const greeting = userName ? `Hi ${userName},` : "Hi there,";
  const limitValid = Number.isFinite(limitAmount) && limitAmount > 0;

  const usageFormatted = formatNumber(usageAmount);
  const limitFormatted = limitValid ? formatNumber(limitAmount) : "N/A";

  const percentage = limitValid
    ? Math.round((usageAmount / limitAmount) * 100)
    : 0;

  const remaining = limitValid ? Math.max(0, limitAmount - usageAmount) : 0;

  const resetDate = formatResetDate(resetsAt);
  const resetsSentence = resetDate
    ? `on ${resetDate}`
    : "at the start of your next billing period";
  const feature = toMidSentence(featureName);
  const previewText =
    percentage >= 100
      ? `You've reached your ${featureName} limit`
      : `You're approaching your ${featureName} limit`;

  // On the top plan there is nothing to upgrade to, so point at us instead of
  // at a pricing page the customer has already bought the whole of.
  let bodyCopy: string;
  if (percentage >= 100) {
    bodyCopy = canUpgrade
      ? `You've reached your ${feature} limit and requests are no longer being processed. They will resume ${resetsSentence}, or as soon as you upgrade your plan.`
      : `You've reached your ${feature} limit and requests are no longer being processed. They will resume ${resetsSentence}. You are already on our highest plan, so reply to this email and we will raise your limit.`;
  } else {
    bodyCopy = canUpgrade
      ? `To avoid any interruption to your service, consider upgrading your plan. Your usage resets ${resetsSentence}.`
      : `Your usage resets ${resetsSentence}. If you expect to go over before then, reply to this email and we will raise your limit.`;
  }

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Section className="mt-[32px]">
              <Img
                alt="Marble Logo"
                className="mx-auto"
                height="40"
                src={logoUrl}
                width="40"
              />
            </Section>

            <Heading className="my-6 text-center font-medium text-2xl text-black">
              {featureName} Usage Alert
            </Heading>

            <Section className="mt-4">
              <Text className="m-0 mb-4 text-[#737373] text-base leading-relaxed">
                {greeting}
              </Text>
              <Text className="m-0 mb-4 text-[#737373] text-base leading-relaxed">
                You've used {percentage}% of your {feature} limit for this
                billing period. You currently have{" "}
                <strong>{remaining.toLocaleString()}</strong> remaining out of{" "}
                {limitFormatted} total.
              </Text>
            </Section>

            <Section
              className="my-6 rounded p-4"
              style={{
                backgroundColor: "#f9fafb",
                border: "1px solid #eaeaea",
              }}
            >
              <Text
                className="m-0 mb-1 text-center text-xs uppercase tracking-wider"
                style={{ color: "#737373" }}
              >
                Current Usage
              </Text>
              <Text className="m-0 text-center font-semibold text-2xl text-black">
                {usageFormatted}{" "}
                <span className="font-normal text-[#737373]">
                  / {limitFormatted}
                </span>
              </Text>
              <Text
                className="m-0 mt-2 text-center text-xs"
                style={{ color: "#737373" }}
              >
                {percentage}% of limit used
              </Text>
            </Section>

            <Section>
              <Text className="m-0 mb-4 text-[#737373] text-base leading-relaxed">
                {bodyCopy}
              </Text>
            </Section>

            {canUpgrade ? (
              <Section className="my-8 text-center">
                <EmailButton href={billingUrl}>View Plans</EmailButton>
              </Section>
            ) : null}

            <Hr className="mx-0 mt-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Need help? Send us an email at{" "}
              <Link
                className="text-[#766df8] no-underline"
                href={`mailto:${EMAIL_CONFIG.replyTo}`}
              >
                {EMAIL_CONFIG.replyTo}
              </Link>{" "}
              or message us on our{" "}
              <Link
                className="text-[#766df8] no-underline"
                href="https://discord.marblecms.com"
              >
                Discord server
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

export default UsageLimitEmail;
