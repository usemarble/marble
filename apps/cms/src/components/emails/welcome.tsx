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

interface WelcomeEmailProps {
  userEmail: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const WelcomeEmail = ({ userEmail }: WelcomeEmailProps) => {
  const previewText = "Welcome to Marble, let's get started!";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/icon.png`}
                width="48"
                height="48"
                alt="Marble Logo"
                className="mx-auto"
              />
            </Section>

            <Heading className="text-black text-2xl font-bold text-center my-6">
              👋 Welcome aboard,
            </Heading>

            <Text className="text-gray-700 text-base leading-relaxed text-center">
              Thanks for signing up with Marble. We're excited to have you in
              our community!
              <br />
              You can now explore all features and start building right away.
            </Text>

            <Section className="text-center my-8">
              <Button
                href={baseUrl}
                className="bg-[#5B4FCC] text-white px-6 py-3 rounded-lg text-sm font-semibold"
              >
                Go to Dashboard
              </Button>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email was intended for{" "}
              <span className="text-black">{userEmail}</span>. If you did not
              create an account, please send an email to support@marblecms.com
              to get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
