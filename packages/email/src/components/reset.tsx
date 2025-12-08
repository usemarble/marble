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

type ResetPasswordProps = {
  userEmail: string;
  resetLink: string;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const ResetPasswordEmail = ({
  userEmail,
  resetLink,
}: ResetPasswordProps) => (
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
              height="48"
              src={`${baseUrl}/icon.png`}
              width="48"
            />
          </Section>

          <Heading className="my-6 text-center font-bold text-2xl text-black">
            Reset your password
          </Heading>

          <Text className="text-center text-base text-gray-700 leading-relaxed">
            Forgot your password? We received a request to reset the password
            for your account. To reset your password, click on the button below:
          </Text>

          <Section className="my-8 text-center">
            <Button
              className="rounded-lg bg-[#5B4FCC] px-6 py-3 font-semibold text-sm text-white"
              href={resetLink}
            >
              Reset your password
            </Button>
          </Section>

          <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
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
