import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

type InviteUserEmailProps = {
  inviteeEmail: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  teamImage: string;
  userImage: string;
  inviteLink: string;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export const InviteUserEmail = ({
  inviteeEmail,
  userImage,
  invitedByUsername,
  teamName,
  teamImage,
  inviteLink,
}: InviteUserEmailProps) => {
  const previewText = `Join ${invitedByUsername} on Marble`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
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
              Join <strong>{teamName}</strong> on <strong>Marble</strong>
            </Heading>

            <Text className="text-center text-base text-gray-700 leading-relaxed">
              <strong>{invitedByUsername}</strong> has invited you to the{" "}
              <strong>{teamName}</strong> workspace on <strong>Marble.</strong>
            </Text>

            <Section>
              <Row>
                <Column align="right">
                  <Img
                    className="rounded-full"
                    height="64"
                    src={userImage}
                    width="64"
                  />
                </Column>
                <Column align="center">
                  <Text className="text-[14px] text-black leading-[24px]">
                    &rarr;
                  </Text>
                </Column>
                <Column align="left">
                  <Img
                    className="rounded-full"
                    height="64"
                    src={teamImage}
                    width="64"
                  />
                </Column>
              </Row>
            </Section>

            <Section className="my-8 text-center">
              <Button
                className="rounded-lg bg-[#5B4FCC] px-6 py-3 font-semibold text-sm text-white"
                href={inviteLink}
              >
                Join the team
              </Button>
            </Section>

            <Text className="text-[14px] text-black leading-[24px]">
              or copy and paste this URL into your browser:{" "}
              <Link className="text-blue-600 no-underline" href={inviteLink}>
                {inviteLink}
              </Link>
            </Text>

            <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This invitation was intended for{" "}
              <span className="text-black">{inviteeEmail}</span>. If you were
              not expecting this invitation, you can ignore the email. If you
              are concerned about your account's safety, please send an email to
              support@marblecms.com to get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteUserEmail;
