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
} from "@react-email/components";

import { EmailButton } from "../components/button";
import { EmailFooter } from "../components/footer";
import { EMAIL_CONFIG } from "../lib/config";

interface UsageLimitEmailProps {
  userName?: string;
  featureName?: string;
  usageAmount?: number;
  limitAmount?: number;
  workspaceId?: string;
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
}: UsageLimitEmailProps) => {
  const previewText = `You're approaching your ${featureName} limit`;
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
                You've used {percentage}% of your {featureName.toLowerCase()}{" "}
                limit for this billing period. You currently have{" "}
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
                {percentage >= 100
                  ? `You've reached your ${featureName.toLowerCase()} limit and requests are no longer being processed. They will resume once your usage resets at the start of your next billing period, or you upgrade your plan.`
                  : "To avoid any interruption to your service, consider upgrading your plan. You can also wait until your usage resets at the start of your next billing period."}
              </Text>
            </Section>

            <Section className="my-8 text-center">
              <EmailButton href={billingUrl}>View Plans</EmailButton>
            </Section>

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
