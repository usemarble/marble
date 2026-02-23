import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";

import { EmailFooter } from "../components/footer";
import { EMAIL_CONFIG } from "../lib/config";

interface FounderEmailProps {
  userEmail: string;
}

export const FounderEmail = ({ userEmail }: FounderEmailProps) => {
  const previewText = "A note from Marble's creator";
  const calLink = EMAIL_CONFIG.calLink;
  const twitterLink = EMAIL_CONFIG.twitterLink;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] p-[20px]">
            <Text className="text-[#333] text-base leading-relaxed">Hi,</Text>

            <Text className="text-[#333] text-base leading-relaxed">
              I'm Taqib, the creator of Marble.
            </Text>

            <Text className="text-[#333] text-base leading-relaxed">
              I built Marble to make writing and publishing feel simple and
              focused.
            </Text>

            <Text className="text-[#333] text-base leading-relaxed">
              If you have any feedback, feature requests, or something feels
              confusing, just reply to this email, I read every message.
            </Text>

            <Text className="text-[#333] text-base leading-relaxed">
              You can also DM me on{" "}
              <Link className="text-[#766df8] no-underline" href={twitterLink}>
                Twitter
              </Link>{" "}
              if that’s easier.
            </Text>

            <Text className="text-[#333] text-base leading-relaxed">
              Thanks,
              <br />
              Taqib
            </Text>

            <Hr />

            <Text className="mt-8 text-[#999] text-xs">
              This email was sent to {userEmail} because you signed up for
              Marble.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
