import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface InviteAcceptedEmailProps {
  inviterEmail: string;
  accepteeEmail: string;
  accepteeUserName: string;
  workspaceName: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const InviteAcceptedEmail = ({
  inviterEmail,
  accepteeEmail,
  accepteeUserName,
  workspaceName,
}: InviteAcceptedEmailProps) => {
  const previewText = `${accepteeUserName} has joined ${workspaceName} on Marble`;

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
              <strong>{accepteeUserName}</strong> has joined{" "}
              <strong>{workspaceName}</strong>
            </Heading>
            <Text className="text-black text-[14px] leading-[24px] text-center">
              <strong>{accepteeEmail}</strong> has successfully accepted your
              invitation and joined the <strong>{workspaceName}</strong>{" "}
              workspace on <strong>Marble.</strong>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This notification was sent to{" "}
              <span className="text-black">{inviterEmail}</span> because{" "}
              <strong className="text-black">{accepteeUserName}</strong>{" "}
              accepted an invitation you sent for the{" "}
              <strong className="text-black">{workspaceName}</strong> workspace.
              If you believe this is an error or have any questions, please email
+             <a href="mailto:support@marblecms.com" className="text-black"> support@marblecms.com</a>
+             to get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteAcceptedEmail;
