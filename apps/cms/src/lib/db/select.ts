/** Reusable Prisma select object for workspace queries */
export const workspaceSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  timezone: true,
  createdAt: true,
  editorPreferences: {
    select: { ai: { select: { enabled: true } } },
  },
  members: {
    select: {
      id: true,
      role: true,
      userId: true,
      organizationId: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  invitations: {
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      organizationId: true,
      inviterId: true,
      expiresAt: true,
    },
  },
  subscription: {
    select: {
      id: true,
      status: true,
      plan: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      canceledAt: true,
    },
  },
} as const;
