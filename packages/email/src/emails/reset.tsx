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

import { EmailButton } from "../components/button";
import { EmailFooter } from "../components/footer";
import { EMAIL_CONFIG } from "../lib/config";

interface ResetPasswordProps {
  userEmail: string;
  resetLink: string;
  baseUrl?: string;
}

export const ResetPasswordEmail = ({
  userEmail,
  resetLink,
}: ResetPasswordProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
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
              Reset your password
            </Heading>

            <Text className="text-center text-[#737373] text-base leading-relaxed">
              We received a request to reset the password for your account. To
              proceed, click on the button below
            </Text>

            <Section className="my-8 text-center">
              <EmailButton href={resetLink}>Reset your password</EmailButton>
            </Section>

            <Hr className="mx-0 mt-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email was intended for{" "}
              <span className="text-black">{userEmail}</span>. If you didn't
              request this, you can safely ignore this email. Need help? Reach
              us at {EMAIL_CONFIG.replyTo}.
            </Text>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ResetPasswordEmail;
