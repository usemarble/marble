import type { CreateEmailOptions } from "resend";

type MockableEmailOptions = CreateEmailOptions & {
  _mockContext?: {
    type: "invite" | "verification" | "reset" | "welcome" | "usage-limit";
    data: Record<string, unknown>;
  };
};

export async function sendDevEmail(options: MockableEmailOptions) {
  console.log("--- MOCK EMAIL SENT (DEVELOPMENT MODE) ---");
  console.log("From:", options.from);
  console.log("To:", options.to);
  console.log("Subject:", options.subject);

  if (options._mockContext) {
    const { type, data } = options._mockContext;
    console.log("Email Type:", type.toUpperCase());
    console.log("Email Data:");
    for (const [key, value] of Object.entries(data)) {
      console.log(`  ${key}:`, value);
    }
  } else {
    console.log("React Component: Email component");
  }

  console.log("----------------------------------------------");

  return { data: { id: "mock-email-id" }, error: null };
}
