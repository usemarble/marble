import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { EmailFooter } from "../components/footer";
import { EMAIL_CONFIG } from "../lib/config";

interface VerifyUserEmailProps {
  userEmail: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
  baseUrl?: string;
}

export const VerifyUserEmail = ({
  userEmail,
  otp,
  type,
}: VerifyUserEmailProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();
  const previewText =
    type === "sign-in"
      ? "Your verification code"
      : type === "email-verification"
        ? "Verify your email address"
        : "Reset your password";

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
              {previewText}
            </Heading>

            <Text className="text-center text-[#737373] text-base leading-relaxed">
              Use the verification code below to complete your verification
              process. This code will expire in 5 minutes.
            </Text>

            <Section className="mt-[32px] mb-[32px] text-center">
              <Text className="font-mono font-semibold text-[28px] tracking-wide">
                {otp}
              </Text>
            </Section>

            <Hr className="mx-0 mt-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email was intended for{" "}
              <span className="text-black">{userEmail}</span>. If you didn't
              request this code, you can safely ignore this email. Need help?
              Reach us at {EMAIL_CONFIG.replyTo}.
            </Text>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerifyUserEmail;
