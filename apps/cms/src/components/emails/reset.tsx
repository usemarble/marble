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
}: ResetPasswordProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/icon.png`}
                width="40"
                height="37"
                alt="logo"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Reset your password
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Forgot your password? We received a request to reset the password
              for your account. To reset your password, click on the button
              below:
            </Text>
            <Button href={resetLink}>Reset your password</Button>
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
