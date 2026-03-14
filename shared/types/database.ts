import type { Organization, Member, Invitation, UserWithRole } from "better-auth/plugins";
import type { Session, Account, Verification } from "better-auth/types";
import type { Generated } from "kysely";

import type { Domain } from "./domain";
import type { Link } from "./link";

export interface User extends UserWithRole {
  username: string;
  displayUsername: string;
}

export interface Database {
  user: User;
  session: Session;
  account: Account;
  verification: Verification;
  organization: Organization;
  member: Member;
  invitation: Invitation;
  link: Omit<Link, "id"> & { id: Generated<string> };
  domain: Omit<Domain, "id"> & { id: Generated<string> };
}
