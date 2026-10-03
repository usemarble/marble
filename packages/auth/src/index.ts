import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { DbClient } from "@marble/db";
import { createRecordId } from "@marble/db/id";
import {
  account,
  accountRelations,
  invitation,
  invitationRelations,
  member,
  memberRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
  verificationRelations,
  workspace,
  workspaceRelations,
} from "@marble/db/schema";
import { type AuthMailer, createAuthMailer } from "@marble/email";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Redis } from "@upstash/redis";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { emailOTP, organization } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { clearMembership } from "./access";
import { trackRegistrationCompleted } from "./analytics";
import type { AuthEnv } from "./env";
import {
  createAuthor,
  storeUserImage,
  validateWorkspaceName,
  validateWorkspaceSchema,
  validateWorkspaceSlug,
  validateWorkspaceTimezone,
} from "./hooks";
import { createPolarSdkClient } from "./polar/client";
import { handleCustomerCreated } from "./polar/customer.created";
import { handleSubscriptionCanceled } from "./polar/subscription.canceled";
import { handleSubscriptionCreated } from "./polar/subscription.created";
import { handleSubscriptionRevoked } from "./polar/subscription.revoked";
import { handleSubscriptionUpdated } from "./polar/subscription.updated";
import {
  getWorkspaceMembershipLimit,
  guardWorkspaceInviteSeat,
} from "./subscription";
import { findWorkspaceToActivate } from "./workspace";

export type { AuthEnv } from "./env";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

function getBodyString(body: unknown, key: string) {
  if (!(body && typeof body === "object" && key in body)) {
    return;
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

async function sendOnboardingEmails(
  mailer: AuthMailer,
  user: { email?: string | null }
) {
  if (!user.email) {
    return;
  }

  try {
    await mailer.sendWelcomeEmail({
      userEmail: user.email,
    });
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }

  try {
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await mailer.sendFounderEmail({
      userEmail: user.email,
      scheduledAt,
    });
  } catch (err) {
    console.error("Failed to schedule founder email:", err);
  }
}

/**
 * Builds Marble's better-auth instance. A factory rather than a singleton
 * because the Worker's Hyperdrive client belongs to one invocation.
 */
export function createAuth({ db, env }: { db: DbClient; env: AuthEnv }) {
  const redis = new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN });
  const mailer = createAuthMailer({
    resendApiKey: env.RESEND_API_KEY,
    development: env.MODE === "dev",
  });
  const polarClient = createPolarSdkClient(
    env.POLAR_ACCESS_TOKEN,
    env.POLAR_SERVER
  );

  const auth = betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.APP_URL],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user,
        session,
        account,
        verification,
        workspace,
        organization: workspace,
        member,
        invitation,
        userRelations,
        sessionRelations,
        accountRelations,
        verificationRelations,
        workspaceRelations,
        memberRelations,
        invitationRelations,
      },
    }),
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/checkout") {
          return;
        }

        const referenceId = getBodyString(ctx.body, "referenceId");

        if (!referenceId) {
          return;
        }

        const session = await getSessionFromCtx(ctx);

        if (!session) {
          throw new APIError("UNAUTHORIZED", {
            message: "You must be logged in to checkout",
          });
        }

        // Polar stores referenceId as checkout metadata, so verify the client-supplied workspace before it can attach a subscription there.
        const memberRecord = await db.query.member.findFirst({
          where: and(
            eq(member.organizationId, referenceId),
            eq(member.userId, session.user.id)
          ),
          columns: {
            role: true,
          },
        });

        if (memberRecord?.role !== "owner") {
          throw new APIError("FORBIDDEN", {
            message: "Only workspace owners can start checkout",
          });
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        // leaveOrganization deletes the member without running the
        // organization hooks, so the cached membership is cleared here.
        if (ctx.path !== "/organization/leave") {
          return;
        }

        const organizationId = getBodyString(ctx.body, "organizationId");
        const session = await getSessionFromCtx(ctx);

        if (organizationId && session) {
          await clearMembership(redis, organizationId, session.user.id);
        }
      }),
    },
    secondaryStorage: {
      get: async (key) => await redis.get(key),
      getAndDelete: async (key) => await redis.getdel(key),
      // TTL applies only when the counter is created (EXPIRE NX), so the
      // rate-limit window never slides forward on later increments.
      increment: async (key, ttl) => {
        const [count] = await redis
          .multi()
          .incr(key)
          .expire(key, ttl, "NX")
          .exec<[number, number]>();
        return count;
      },
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
        await mailer.sendResetPassword({
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
    emailVerification: {
      afterEmailVerification: async (user) => {
        await sendOnboardingEmails(mailer, user);
      },
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: env.GITHUB_ID,
        clientSecret: env.GITHUB_SECRET,
      },
    },
    advanced: {
      useSecureCookies: env.MODE !== "dev",
      database: {
        // Prisma applied @default(cuid()) in the client; Drizzle has no DB default.
        generateId: () => createRecordId(),
        joins: true,
      },
      // Share the session cookie with sibling subdomains so the API Worker
      // can read it. Unset in development, where localhost already shares it.
      ...(env.AUTH_COOKIE_DOMAIN && {
        crossSubDomainCookies: {
          enabled: true,
          domain: env.AUTH_COOKIE_DOMAIN,
        },
      }),
      cookiePrefix: env.AUTH_COOKIE_PREFIX,
    },
    organization: {
      modelName: "workspace",
    },
    plugins: [
      polar({
        client: polarClient,
        createCustomerOnSignUp: env.MODE !== "dev",
        authenticatedUsersOnly: true,
        use: [
          portal(),
          usage(),
          checkout({
            products: [
              {
                productId: env.POLAR_HOBBY_MONTHLY_PRODUCT_ID,
                slug: "hobby",
              },
              {
                productId: env.POLAR_HOBBY_YEARLY_PRODUCT_ID,
                slug: "hobby-yearly",
              },
              {
                productId: env.POLAR_PRO_MONTHLY_PRODUCT_ID,
                slug: "pro",
              },
              {
                productId: env.POLAR_PRO_YEARLY_PRODUCT_ID,
                slug: "pro-yearly",
              },
            ],
            successUrl: env.POLAR_SUCCESS_URL,
          }),
          webhooks({
            secret: env.POLAR_WEBHOOK_SECRET,
            onCustomerCreated: async (payload) => {
              await handleCustomerCreated(payload);
            },
            onSubscriptionCreated: async (payload) => {
              await handleSubscriptionCreated(db, redis, payload);
            },
            onSubscriptionUpdated: async (payload) => {
              await handleSubscriptionUpdated(db, redis, payload);
            },
            onSubscriptionCanceled: async (payload) => {
              await handleSubscriptionCanceled(db, redis, payload);
            },
            onSubscriptionRevoked: async (payload) => {
              await handleSubscriptionRevoked(db, redis, payload);
            },
          }),
        ],
      }),
      organization({
        // Seats come from the workspace's plan. Better Auth enforces this when an
        // invitation is accepted and when a member is added directly, which is
        // what keeps seats bought on a trial from outliving the downgrade.
        membershipLimit: (_user, organization) =>
          getWorkspaceMembershipLimit(db, organization.id),
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
          const inviteLink = `${env.APP_URL}/join/${data.id}`;
          await mailer.sendInviteEmail({
            inviteeEmail: data.email,
            inviterName: data.inviter.user.name,
            inviterEmail: data.inviter.user.email,
            workspaceName: data.organization.name,
            inviteLink,
          });
        },
        organizationHooks: {
          afterCreateOrganization: async ({ organization, user }) => {
            await createAuthor(db, user, organization);
          },
          afterAcceptInvitation: async ({ user, organization }) => {
            await createAuthor(db, user, organization);
          },
          afterRemoveMember: async ({ user, organization }) => {
            await clearMembership(redis, organization.id, user.id);
          },
          afterUpdateMemberRole: async ({ user, organization }) => {
            await clearMembership(redis, organization.id, user.id);
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
            await guardWorkspaceInviteSeat(db, organization.id);
          },
        },
      }),
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          await mailer.sendVerificationEmail({
            userEmail: email,
            otp,
            type,
          });
        },
      }),
    ],

    databaseHooks: {
      // To set active organization when a session is created
      // This works but only when user isnt a new user i.e they already have an organization
      // for new users the middleware redirects them to create a workspace (organization)
      session: {
        create: {
          before: async (session) => {
            try {
              const organization = await findWorkspaceToActivate(
                db,
                session.userId
              );
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
          after: async (user, context) => {
            const avatar = await storeUserImage(env, user);
            if (avatar) {
              const { internalAdapter } = await auth.$context;
              // Better Auth also refreshes Redis sessions when a user changes.
              await internalAdapter.updateUser(user.id, {
                image: avatar.avatarUrl,
              });
              user.image = avatar.avatarUrl;
            }

            if (user.emailVerified) {
              await sendOnboardingEmails(mailer, user);
            }

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

            const path = context?.path ?? "";
            const method = path.includes("sign-up/email")
              ? "email"
              : path.includes("callback/google")
                ? "google"
                : path.includes("callback/github")
                  ? "github"
                  : "unknown";
            await trackRegistrationCompleted({
              env,
              userId: user.id,
              cookieHeader: context?.headers?.get("cookie"),
              method,
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

  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
