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

interface VerifyUserEmailProps {
  userEmail: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const VerifyUserEmail = ({
  userEmail,
  otp,
  type,
}: VerifyUserEmailProps) => {
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
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/logo.png`}
                width="40"
                height="37"
                alt="logo"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              {previewText}
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Use the verification code below to complete your verification
              process. This code will expire in 5 minutes.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Text className="text-[28px] font-mono font-semibold tracking-wide">
                {otp}
              </Text>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email was intended for{" "}
              <span className="text-black">{userEmail}</span>. If you did not
              request this code, you can ignore this email. If you are concerned
              about your account's safety, please send an email to
              support@marblecms.com to get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
