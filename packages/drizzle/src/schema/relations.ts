import { relations } from "drizzle-orm";
import {
  account,
  apiKey,
  author,
  authorSocial,
  category,
  exportJob,
  field,
  fieldOption,
  fieldValue,
  importItem,
  importJob,
  invitation,
  media,
  member,
  post,
  postToAuthor,
  postToTag,
  session,
  shareLink,
  subscription,
  tag,
  usageAlert,
  usageEvent,
  user,
  userNotificationPreferences,
  verification,
  webhookDelivery,
  webhookDeliveryAttempt,
  webhookEndpoint,
  workspace,
  workspaceEvent,
  workspaceNotificationPreferences,
} from "./tables";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation, { relationName: "invitationInviter" }),
  subscriptions: many(subscription),
  authors: many(author),
  apiKeys: many(apiKey),
  notificationPreferences: one(userNotificationPreferences, {
    fields: [user.id],
    references: [userNotificationPreferences.userId],
  }),
  exportJobs: many(exportJob),
  importJobs: many(importJob),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const verificationRelations = relations(verification, () => ({}));

export const workspaceRelations = relations(workspace, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  subscriptions: many(subscription),
  authors: many(author),
  categories: many(category),
  tags: many(tag),
  posts: many(post),
  media: many(media),
  shareLinks: many(shareLink),
  fields: many(field),
  fieldOptions: many(fieldOption),
  fieldValues: many(fieldValue),
  apiKeys: many(apiKey),
  webhookEndpoints: many(webhookEndpoint),
  usageEvents: many(usageEvent),
  usageAlerts: many(usageAlert),
  workspaceEvents: many(workspaceEvent),
  webhookDeliveries: many(webhookDelivery),
  exportJobs: many(exportJob),
  importJobs: many(importJob),
  importItems: many(importItem),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(workspace, {
    fields: [member.organizationId],
    references: [workspace.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  notificationPreferences: one(workspaceNotificationPreferences, {
    fields: [member.id],
    references: [workspaceNotificationPreferences.memberId],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(workspace, {
    fields: [invitation.organizationId],
    references: [workspace.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
    relationName: "invitationInviter",
  }),
}));

export const userNotificationPreferencesRelations = relations(
  userNotificationPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [userNotificationPreferences.userId],
      references: [user.id],
    }),
  })
);

export const workspaceNotificationPreferencesRelations = relations(
  workspaceNotificationPreferences,
  ({ one }) => ({
    member: one(member, {
      fields: [workspaceNotificationPreferences.memberId],
      references: [member.id],
    }),
  })
);

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
  workspace: one(workspace, {
    fields: [subscription.workspaceId],
    references: [workspace.id],
  }),
}));

export const authorRelations = relations(author, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [author.workspaceId],
    references: [workspace.id],
  }),
  user: one(user, {
    fields: [author.userId],
    references: [user.id],
  }),
  socials: many(authorSocial),
  primaryPosts: many(post, { relationName: "PrimaryAuthor" }),
  coAuthoredPosts: many(postToAuthor),
}));

export const authorSocialRelations = relations(authorSocial, ({ one }) => ({
  author: one(author, {
    fields: [authorSocial.authorId],
    references: [author.id],
  }),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [category.workspaceId],
    references: [workspace.id],
  }),
  posts: many(post),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [tag.workspaceId],
    references: [workspace.id],
  }),
  posts: many(postToTag),
}));

export const postRelations = relations(post, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [post.workspaceId],
    references: [workspace.id],
  }),
  category: one(category, {
    fields: [post.categoryId],
    references: [category.id],
  }),
  primaryAuthor: one(author, {
    fields: [post.primaryAuthorId],
    references: [author.id],
    relationName: "PrimaryAuthor",
  }),
  tags: many(postToTag),
  authors: many(postToAuthor),
  shareLinks: many(shareLink),
  fieldValues: many(fieldValue),
}));

export const postToTagRelations = relations(postToTag, ({ one }) => ({
  post: one(post, {
    fields: [postToTag.a],
    references: [post.id],
  }),
  tag: one(tag, {
    fields: [postToTag.b],
    references: [tag.id],
  }),
}));

export const postToAuthorRelations = relations(postToAuthor, ({ one }) => ({
  author: one(author, {
    fields: [postToAuthor.a],
    references: [author.id],
  }),
  post: one(post, {
    fields: [postToAuthor.b],
    references: [post.id],
  }),
}));

export const shareLinkRelations = relations(shareLink, ({ one }) => ({
  post: one(post, {
    fields: [shareLink.postId],
    references: [post.id],
  }),
  workspace: one(workspace, {
    fields: [shareLink.workspaceId],
    references: [workspace.id],
  }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  workspace: one(workspace, {
    fields: [media.workspaceId],
    references: [workspace.id],
  }),
}));

export const fieldRelations = relations(field, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [field.workspaceId],
    references: [workspace.id],
  }),
  options: many(fieldOption),
  values: many(fieldValue),
}));

export const fieldOptionRelations = relations(fieldOption, ({ one }) => ({
  field: one(field, {
    fields: [fieldOption.fieldId, fieldOption.workspaceId],
    references: [field.id, field.workspaceId],
  }),
  workspace: one(workspace, {
    fields: [fieldOption.workspaceId],
    references: [workspace.id],
  }),
}));

export const fieldValueRelations = relations(fieldValue, ({ one }) => ({
  post: one(post, {
    fields: [fieldValue.postId, fieldValue.workspaceId],
    references: [post.id, post.workspaceId],
  }),
  field: one(field, {
    fields: [fieldValue.fieldId, fieldValue.workspaceId],
    references: [field.id, field.workspaceId],
  }),
  workspace: one(workspace, {
    fields: [fieldValue.workspaceId],
    references: [workspace.id],
  }),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  workspace: one(workspace, {
    fields: [apiKey.workspaceId],
    references: [workspace.id],
  }),
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id],
  }),
}));

export const webhookEndpointRelations = relations(
  webhookEndpoint,
  ({ one, many }) => ({
    workspace: one(workspace, {
      fields: [webhookEndpoint.workspaceId],
      references: [workspace.id],
    }),
    deliveries: many(webhookDelivery),
  })
);

export const workspaceEventRelations = relations(
  workspaceEvent,
  ({ one, many }) => ({
    workspace: one(workspace, {
      fields: [workspaceEvent.workspaceId],
      references: [workspace.id],
    }),
    deliveries: many(webhookDelivery),
  })
);

export const webhookDeliveryRelations = relations(
  webhookDelivery,
  ({ one, many }) => ({
    event: one(workspaceEvent, {
      fields: [webhookDelivery.eventId],
      references: [workspaceEvent.id],
    }),
    workspace: one(workspace, {
      fields: [webhookDelivery.workspaceId],
      references: [workspace.id],
    }),
    webhookEndpoint: one(webhookEndpoint, {
      fields: [webhookDelivery.webhookEndpointId],
      references: [webhookEndpoint.id],
    }),
    attempts: many(webhookDeliveryAttempt),
  })
);

export const webhookDeliveryAttemptRelations = relations(
  webhookDeliveryAttempt,
  ({ one }) => ({
    delivery: one(webhookDelivery, {
      fields: [webhookDeliveryAttempt.deliveryId],
      references: [webhookDelivery.id],
    }),
  })
);

export const usageEventRelations = relations(usageEvent, ({ one }) => ({
  workspace: one(workspace, {
    fields: [usageEvent.workspaceId],
    references: [workspace.id],
  }),
}));

export const usageAlertRelations = relations(usageAlert, ({ one }) => ({
  workspace: one(workspace, {
    fields: [usageAlert.workspaceId],
    references: [workspace.id],
  }),
}));

export const exportJobRelations = relations(exportJob, ({ one }) => ({
  workspace: one(workspace, {
    fields: [exportJob.workspaceId],
    references: [workspace.id],
  }),
  createdBy: one(user, {
    fields: [exportJob.createdById],
    references: [user.id],
  }),
}));

export const importJobRelations = relations(importJob, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [importJob.workspaceId],
    references: [workspace.id],
  }),
  createdBy: one(user, {
    fields: [importJob.createdById],
    references: [user.id],
  }),
  items: many(importItem),
}));

export const importItemRelations = relations(importItem, ({ one }) => ({
  job: one(importJob, {
    fields: [importItem.importJobId, importItem.workspaceId],
    references: [importJob.id, importJob.workspaceId],
  }),
  workspace: one(workspace, {
    fields: [importItem.workspaceId],
    references: [workspace.id],
  }),
}));
