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

export const shareLinkRelations = relations(shareLink, ({one}) => ({
  post: one(post, {
    fields: [shareLink.postId],
    references: [post.id]
  }),
  workspace: one(workspace, {
    fields: [shareLink.workspaceId],
    references: [workspace.id]
  }),
}));

export const postRelations = relations(post, ({ one, many }) => ({
  shareLinks: many(shareLink),
  fieldValues: many(fieldValue),
  category: one(category, {
    fields: [post.categoryId],
    references: [category.id],
  }),
  workspace: one(workspace, {
    fields: [post.workspaceId],
    references: [workspace.id],
  }),
  primaryAuthor: one(author, {
    fields: [post.primaryAuthorId],
    references: [author.id],
    relationName: "PrimaryAuthor",
  }),
  tags: many(postToTag),
  authors: many(postToAuthor),
}));

export const workspaceRelations = relations(workspace, ({many}) => ({
  shareLinks: many(shareLink),
  usageEvents: many(usageEvent),
  apiKeys: many(apiKey),
  subscriptions: many(subscription),
  fields: many(field),
  fieldOptions: many(fieldOption),
  fieldValues: many(fieldValue),
  media: many(media),
  workspaceEvents: many(workspaceEvent),
  webhookDeliveries: many(webhookDelivery),
  usageAlerts: many(usageAlert),
  importItems: many(importItem),
  exportJobs: many(exportJob),
  importJobs: many(importJob),
  webhookEndpoints: many(webhookEndpoint),
  categories: many(category),
  tags: many(tag),
  posts: many(post),
  invitations: many(invitation),
  members: many(member),
  authors: many(author),
}));

export const usageEventRelations = relations(usageEvent, ({one}) => ({
  workspace: one(workspace, {
    fields: [usageEvent.workspaceId],
    references: [workspace.id]
  }),
}));

export const authorSocialRelations = relations(authorSocial, ({one}) => ({
  author: one(author, {
    fields: [authorSocial.authorId],
    references: [author.id]
  }),
}));

export const authorRelations = relations(author, ({ one, many }) => ({
  socials: many(authorSocial),
  primaryPosts: many(post, { relationName: "PrimaryAuthor" }),
  coAuthoredPosts: many(postToAuthor),
  workspace: one(workspace, {
    fields: [author.workspaceId],
    references: [workspace.id],
  }),
  user: one(user, {
    fields: [author.userId],
    references: [user.id],
  }),
}));

export const apiKeyRelations = relations(apiKey, ({one}) => ({
  workspace: one(workspace, {
    fields: [apiKey.workspaceId],
    references: [workspace.id]
  }),
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id]
  }),
}));

export const userRelations = relations(user, ({ many, one }) => ({
  apiKeys: many(apiKey),
  subscriptions: many(subscription),
  notificationPreferences: one(userNotificationPreferences, {
    fields: [user.id],
    references: [userNotificationPreferences.userId],
  }),
  exportJobs: many(exportJob),
  importJobs: many(importJob),
  sessions: many(session),
  accounts: many(account),
  invitations: many(invitation, { relationName: "invitationInviter" }),
  members: many(member),
  authors: many(author),
}));

export const subscriptionRelations = relations(subscription, ({one}) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id]
  }),
  workspace: one(workspace, {
    fields: [subscription.workspaceId],
    references: [workspace.id]
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

export const workspaceNotificationPreferencesRelations = relations(workspaceNotificationPreferences, ({one}) => ({
  member: one(member, {
    fields: [workspaceNotificationPreferences.memberId],
    references: [member.id]
  }),
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

export const mediaRelations = relations(media, ({one}) => ({
  workspace: one(workspace, {
    fields: [media.workspaceId],
    references: [workspace.id]
  }),
}));

export const userNotificationPreferencesRelations = relations(userNotificationPreferences, ({one}) => ({
  user: one(user, {
    fields: [userNotificationPreferences.userId],
    references: [user.id]
  }),
}));

export const workspaceEventRelations = relations(workspaceEvent, ({one, many}) => ({
  workspace: one(workspace, {
    fields: [workspaceEvent.workspaceId],
    references: [workspace.id]
  }),
  webhookDeliveries: many(webhookDelivery),
}));

export const webhookDeliveryRelations = relations(webhookDelivery, ({ one, many }) => ({
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
}));

export const webhookEndpointRelations = relations(webhookEndpoint, ({ one, many }) => ({
  deliveries: many(webhookDelivery),
  workspace: one(workspace, {
    fields: [webhookEndpoint.workspaceId],
    references: [workspace.id],
  }),
}));

export const webhookDeliveryAttemptRelations = relations(
  webhookDeliveryAttempt,
  ({ one }) => ({
    delivery: one(webhookDelivery, {
      fields: [webhookDeliveryAttempt.deliveryId],
      references: [webhookDelivery.id],
    }),
  })
);

export const usageAlertRelations = relations(usageAlert, ({one}) => ({
  workspace: one(workspace, {
    fields: [usageAlert.workspaceId],
    references: [workspace.id]
  }),
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

export const importJobRelations = relations(importJob, ({ one, many }) => ({
  items: many(importItem),
  workspace: one(workspace, {
    fields: [importJob.workspaceId],
    references: [workspace.id],
  }),
  createdBy: one(user, {
    fields: [importJob.createdById],
    references: [user.id],
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

export const categoryRelations = relations(category, ({one, many}) => ({
  workspace: one(workspace, {
    fields: [category.workspaceId],
    references: [workspace.id]
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

export const sessionRelations = relations(session, ({one}) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id]
  }),
}));

export const accountRelations = relations(account, ({one}) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id]
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

export const postToTagRelations = relations(postToTag, ({one}) => ({
  post: one(post, {
    fields: [postToTag.a],
    references: [post.id]
  }),
  tag: one(tag, {
    fields: [postToTag.b],
    references: [tag.id]
  }),
}));

export const postToAuthorRelations = relations(postToAuthor, ({one}) => ({
  author: one(author, {
    fields: [postToAuthor.a],
    references: [author.id]
  }),
  post: one(post, {
    fields: [postToAuthor.b],
    references: [post.id]
  }),
}));
export const verificationRelations = relations(verification, () => ({}));
