import { db } from "@marble/db";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, organization } from "better-auth/plugins";
import { customAlphabet } from "nanoid";
import {
  sendInviteEmailAction,
  sendResetPasswordAction,
  sendVerificationEmailAction,
  sendWelcomeEmailAction,
} from "@/lib/actions/email";
import { storeUserImageAction } from "@/lib/actions/user";
import { handleCustomerCreated } from "@/lib/polar/customer.created";
import { handleSubscriptionCanceled } from "@/lib/polar/subscription.canceled";
import { handleSubscriptionCreated } from "@/lib/polar/subscription.created";
import { handleSubscriptionRevoked } from "@/lib/polar/subscription.revoked";
import { handleSubscriptionUpdated } from "@/lib/polar/subscription.updated";
import { getLastActiveWorkspaceOrNewOneToSetAsActive } from "@/lib/queries/workspace";
import { guardWorkspaceSubscriptionAction } from "../actions/checks";
import {
  createAuthor,
  validateWorkspaceName,
  validateWorkspaceSchema,
  validateWorkspaceSlug,
  validateWorkspaceTimezone,
} from "../actions/workspace";
import { redis } from "../redis";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secondaryStorage: {
    get: async (key) => await redis.get(key),
    set: async (key, value, ttl) => {
      if (ttl) {
        await redis.set(key, value, { ex: ttl });
      } else {
        await redis.set(key, value);
      }
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },
  session: {
    storeSessionInDatabase: true,
    preserveSessionInDatabase: true,
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }, _request) => {
      await sendResetPasswordAction({
        userEmail: user.email,
        resetLink: url,
      });
    },
    // requireEmailVerification: true,
    // autoSignIn: true
    // ideally that would prevent a session being created on signup
    // problem is after otp verification user has to login again and
    // I don't really like the experience so we'll allow session creation
    // but block unverified users via the middleware
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  organization: {
    modelName: "workspace",
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: process.env.NODE_ENV === "production",
      authenticatedUsersOnly: true,
      use: [
        portal(),
        usage(),
        checkout({
          products: [
            {
              productId: process.env.POLAR_HOBBY_PRODUCT_ID || "",
              slug: "hobby",
            },
            {
              productId: process.env.POLAR_PRO_PRODUCT_ID || "",
              slug: "pro",
            },
            {
              productId: process.env.POLAR_TEAM_PRODUCT_ID || "",
              slug: "team",
            },
          ],
          successUrl: process.env.POLAR_SUCCESS_URL || "",
        }),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET || "",
          onCustomerCreated: async (payload) => {
            await handleCustomerCreated(payload);
          },
          onSubscriptionCreated: async (payload) => {
            await handleSubscriptionCreated(payload);
          },
          onSubscriptionUpdated: async (payload) => {
            await handleSubscriptionUpdated(payload);
          },
          onSubscriptionCanceled: async (payload) => {
            await handleSubscriptionCanceled(payload);
          },
          onSubscriptionRevoked: async (payload) => {
            await handleSubscriptionRevoked(payload);
          },
        }),
      ],
    }),
    organization({
      // membershipLimit: 10,
      // check plan limits and set membershipLimit
      schema: {
        organization: {
          additionalFields: {
            timezone: {
              type: "string",
              input: true,
              required: false,
            },
          },
        },
      },
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join/${data.id}`;
        await sendInviteEmailAction({
          inviteeEmail: data.email,
          inviterName: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          workspaceName: data.organization.name,
          teamLogo: data.organization.logo,
          inviteLink,
        });
      },
      organizationHooks: {
        afterCreateOrganization: async ({ organization, user }) => {
          await createAuthor(user, organization);
        },
        afterAcceptInvitation: async ({ user, organization }) => {
          await createAuthor(user, organization);
        },
        beforeCreateOrganization: async ({ organization }) => {
          await validateWorkspaceSchema({
            slug: organization.slug,
            name: organization.name,
            timezone: organization.timezone,
          });
        },
        beforeUpdateOrganization: async ({ organization }) => {
          if (organization.slug) {
            await validateWorkspaceSlug(organization.slug);
          }
          if (organization.name) {
            await validateWorkspaceName(organization.name);
          }
          if (organization.timezone) {
            await validateWorkspaceTimezone(organization.timezone);
          }
        },
        beforeCreateInvitation: async ({ organization }) => {
          await guardWorkspaceSubscriptionAction(
            organization.id,
            "Upgrade to Pro to invite team members"
          );
        },
        // beforeAddMember: async ({ organization }) => {
        //   await guardWorkspaceSubscriptionAction(
        //     organization.id,
        //     "Upgrade to Pro to add team members"
        //   );
        // },
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendVerificationEmailAction({
          userEmail: email,
          otp,
          type,
        });
      },
    }),
    nextCookies(),
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Check whether it is a sign-up
      if (ctx.path.startsWith("/sign-up")) {
        const newSession = ctx.context.newSession;
        if (newSession?.user?.email) {
          try {
            await sendWelcomeEmailAction({
              userEmail: newSession.user.email,
            });
          } catch (err) {
            console.error("Failed to send welcome email:", err);
          }
        }
      }
    }),
  },
  databaseHooks: {
    // To set active organization when a session is created
    // This works but only when user isnt a new user i.e they already have an organization
    // for new users the middleware redirects them to create a workspace (organization)
    session: {
      create: {
        before: async (session) => {
          try {
            const organization =
              await getLastActiveWorkspaceOrNewOneToSetAsActive(session.userId);
            return {
              data: {
                ...session,
                activeOrganizationId: organization?.id || null,
              },
            };
          } catch (_error) {
            // If there's an error, create the session without an active org
            return { data: session };
          }
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          await storeUserImageAction(user);

          const email = user.email || "";
          const raw = email.split("@")[0] || "";
          const base = raw
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 20);

          const slug = `${base || "marble"}-${nanoid()}`;

          await auth.api.createOrganization({
            body: {
              name: "Personal",
              slug,
              timezone: "Europe/London",
              userId: user.id,
              logo: `https://api.dicebear.com/9.x/glass/svg?seed=${slug}`,
            },
          });
        },
      },
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
});
