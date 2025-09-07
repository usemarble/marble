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

interface ResetPasswordProps {
  userEmail: string;
  resetLink: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const ResetPasswordEmail = ({
  userEmail,
  resetLink,
}: ResetPasswordProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
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
              Reset your password
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Forgot your password? We received a request to reset the password
              for your account. To reset your password, click on the button
              below:
            </Text>
            <Button href={resetLink}>Reset your password</Button>
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
