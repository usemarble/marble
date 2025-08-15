import {
  Body,
  Button,
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

interface ResetPasswordEmailProps {
  userEmail: string;
  resetUrl: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const ResetPasswordEmail = ({
  userEmail,
  resetUrl,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password for Marble</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/logo.png`}
                width="40"
                height="37"
                alt="Marble logo"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Reset your password
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              We received a request to reset your password for your Marble
              account. Click the button below to create a new password. This
              link will expire in 1 hour.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[hsl(244,100%,65%)] text-white text-[12px] font-semibold no-underline text-center px-[20px] py-[12px] rounded"
                href={resetUrl}
              >
                Reset Password
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              If you didn't request this password reset, you can safely ignore
              this email. Your password will remain unchanged.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email was intended for{" "}
              <span className="text-black">{userEmail}</span>. If you have any
              concerns about your account's safety, please contact us at
              support@marblecms.com.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
