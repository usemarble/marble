import type { authClient } from "./client";
import type { auth } from "./server";

export type Session = typeof auth.$Infer.Session;
export type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization;
export type Organization = typeof authClient.$Infer.Organization;
export type Invitation = typeof authClient.$Infer.Invitation;
