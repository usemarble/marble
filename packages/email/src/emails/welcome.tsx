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

interface WelcomeEmailProps {
  userEmail: string;
  baseUrl?: string;
}

export const WelcomeEmail = ({
  userEmail,
  baseUrl = EMAIL_CONFIG.getAppUrl(),
}: WelcomeEmailProps) => {
  const previewText = "Welcome to Marble, let's get started!";
  const logoUrl = EMAIL_CONFIG.getLogoUrl();

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
              👋 Welcome aboard
            </Heading>

            <Text className="text-center text-[#737373] text-base leading-relaxed">
              Thanks for signing up! Here's how to get the most out of Marble:
            </Text>

            <Section className="my-8">
              <Text className="mb-4 font-medium text-black text-sm">
                📚 Get started
              </Text>
              <Text className="mb-6 text-[#737373] text-sm leading-relaxed">
                Check out our{" "}
                <Link
                  className="text-[#766df8] no-underline"
                  href="https://docs.marblecms.com"
                >
                  documentation
                </Link>{" "}
                to learn how to set up your workspace, how to use the API, and
                learn more about the features.
              </Text>

              <Text className="mb-4 font-medium text-black text-sm">
                💬 Join the community
              </Text>
              <Text className="mb-6 text-[#737373] text-sm leading-relaxed">
                Have questions? Join our{" "}
                <Link
                  className="text-[#766df8] no-underline"
                  href="https://discord.marblecms.com"
                >
                  Discord
                </Link>{" "}
                to chat with other users and get help from the team.
              </Text>

              <Text className="mb-4 font-medium text-black text-sm">
                🐦 Stay updated
              </Text>
              <Text className="mb-6 text-[#737373] text-sm leading-relaxed">
                Follow us on{" "}
                <Link
                  className="text-[#766df8] no-underline"
                  href="https://x.com/usemarblecms"
                >
                  Twitter
                </Link>{" "}
                for product updates, tips, and announcements.
              </Text>
            </Section>

            <Section className="my-8 text-center">
              <EmailButton href={baseUrl}>Go to Dashboard</EmailButton>
            </Section>

            <Hr className="mx-0 mt-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email was intended for{" "}
              <span className="text-black">{userEmail}</span>. If you didn't
              create an account, you can safely ignore this email. Need help?
              Reach us at {EMAIL_CONFIG.replyTo}.
            </Text>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
