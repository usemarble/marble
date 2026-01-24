import { Hr, Link, Section, Text } from "@react-email/components";
import { EMAIL_CONFIG } from "../lib/config";

export const EmailFooter = () => {
  const currentYear = new Date().getFullYear();
  const { physicalAddress } = EMAIL_CONFIG;

  return (
    <Section>
      <Hr className="mx-0 mb-[26px] w-full border border-[#eaeaea] border-solid" />
      {physicalAddress.street && (
        <Text className="m-0 text-center text-xs" style={{ color: "#717175" }}>
          {physicalAddress.name}
          <br />
          {physicalAddress.street}
          <br />
          {physicalAddress.city}, {physicalAddress.state} {physicalAddress.zip}
          <br />
          {physicalAddress.country}
        </Text>
      )}
      <Text className="mt-4 text-center text-xs" style={{ color: "#717175" }}>
        © {currentYear} Marble. All rights reserved.
      </Text>
      <Text className="mt-4 text-center text-xs" style={{ color: "#717175" }}>
        <Link
          href="https://marblecms.com"
          style={{ color: "#717175", textDecoration: "underline" }}
        >
          Website
        </Link>
        {" · "}
        <Link
          href="https://docs.marblecms.com"
          style={{ color: "#717175", textDecoration: "underline" }}
        >
          Documentation
        </Link>
        {" · "}
        <Link
          href={`mailto:${EMAIL_CONFIG.replyTo}`}
          style={{ color: "#717175", textDecoration: "underline" }}
        >
          Support
        </Link>
      </Text>
    </Section>
  );
};
