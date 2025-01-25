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

interface VerifyEmailProps {
  userEmail: string;
  url: string;
}

const baseUrl = "https://marblecms-app.vercel.app";

export const VerifyEmail = ({ userEmail, url }: VerifyEmailProps) => {
  const previewText = "Verify your email address";

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
              Verify your email address.
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Click the button below to verify your email address. If you did
              not create an account with this email, you can ignore this email.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={url}
              >
                Verify your email
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email was intended for{" "}
              <span className="text-black">{userEmail}</span>. If you were not
              expecting this invitation, you can ignore the email. If you are
              concerned about your account's safety, please send an email to
              support@marble.blog to get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerifyEmail;
