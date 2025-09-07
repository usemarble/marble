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
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/icon.png`}
                width="40"
                height="37"
                alt="logo"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              {previewText}
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Use the verification code below to complete your verification
              process. This code will expire in 5 minutes.
            </Text>
            <Section className="mb-[32px] mt-[32px] text-center">
              <Text className="font-mono text-[28px] font-semibold tracking-wide">
                {otp}
              </Text>
            </Section>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
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
