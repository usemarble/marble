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
} from "react-email";

import { EmailButton } from "../components/button";
import { EmailFooter } from "../components/footer";
import { EMAIL_CONFIG } from "../lib/config";

interface ExportReadyEmailProps {
  userName?: string;
  workspaceName: string;
  downloadUrl: string;
  expiresAt: string;
}

export const ExportReadyEmail = ({
  userName,
  workspaceName,
  downloadUrl,
  expiresAt,
}: ExportReadyEmailProps) => {
  const logoUrl = EMAIL_CONFIG.getLogoUrl();
  const greeting = userName ? `Hi ${userName},` : "Hi there,";

  return (
    <Html lang="en">
      <Head />
      <Preview>Your Marble export is ready to download</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Section className="mt-[32px]">
              <Img
                alt="Marble Logo"
                className="mx-auto"
                height="40"
                src={logoUrl}
                width="40"
              />
            </Section>

            <Heading className="my-6 text-center font-medium text-2xl text-black">
              Your export is ready
            </Heading>

            <Section className="mt-4">
              <Text className="m-0 mb-4 text-[#737373] text-base leading-relaxed">
                {greeting}
              </Text>
              <Text className="m-0 mb-4 text-[#737373] text-base leading-relaxed">
                Your export for <strong>{workspaceName}</strong> is ready. The
                download link expires on {expiresAt}.
              </Text>
            </Section>

            <Section className="my-8 text-center">
              <EmailButton href={downloadUrl}>Download Export</EmailButton>
            </Section>

            <Hr className="mx-0 mt-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              You can also visit your workspace settings to download your
              export.
            </Text>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ExportReadyEmail;
