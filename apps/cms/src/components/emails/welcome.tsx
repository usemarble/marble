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
  Button,
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
        <Body className="bg-gray-50 font-sans">
          <Container className="bg-white rounded-2xl shadow-md my-10 mx-auto p-8 max-w-[480px]">
            {/* Logo */}
            <Section className="text-center">
              <Img
                src={`${baseUrl}/logo.png`}
                width="48"
                height="48"
                alt="Marble Logo"
                className="mx-auto"
              />
            </Section>

            {/* Headline */}
            <Heading className="text-black text-2xl font-bold text-center my-6">
              Welcome aboard,
            </Heading>

            {/* Intro */}
            <Text className="text-gray-700 text-base leading-relaxed text-center">
              Thanks for signing up with Marble. We’re excited to have you in the
              community!  
              <br />
              You can now explore all features and start building right away.
            </Text>

            {/* Call to Action */}
            <Section className="text-center my-8">
              <Button
                href={baseUrl}
                className="bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold"
              >
                Go to Dashboard
              </Button>
            </Section>

            <Hr className="border-t border-gray-200 my-6" />

            {/* Footer */}
            <Text className="text-gray-500 text-xs leading-relaxed text-center">
              This email was sent to <span className="text-black">{userEmail}</span>.  
              If you didn’t create an account, please contact our support team at{" "}
              <a href="mailto:support@marblecms.com" className="text-black underline">
                support@marblecms.com
              </a>.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
