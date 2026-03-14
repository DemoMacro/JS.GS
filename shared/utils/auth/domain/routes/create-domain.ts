import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import type { Organization } from "better-auth/plugins";

import { CreateDomainSchema, type Domain } from "../../../../types/domain";

const generateVerificationToken = (): string => {
  return crypto
    .getRandomValues(new Uint8Array(16))
    .reduce((str, byte) => str + (byte % 36).toString(36), "");
};

export const createDomain = () => {
  return createAuthEndpoint(
    "/domain/create",
    {
      method: "POST",
      body: CreateDomainSchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "Create a new custom domain",
          responses: {
            "200": {
              description: "Domain created successfully",
            },
          },
        },
      },
    },
    async (ctx) => {
      const session = await getSessionFromCtx(ctx);
      if (!session) {
        throw new APIError("UNAUTHORIZED", {
          message: "Authentication required",
        });
      }

      let { domainName, organizationId } = ctx.body;

      // For authenticated users without organization, auto-use/create personal organization
      if (session?.user && !organizationId) {
        const personalOrgSlug = `user_${session.user.id}`;

        // Try to find existing personal organization
        const personalOrg = await ctx.context.adapter.findOne<Organization>({
          model: "organization",
          where: [{ field: "slug", value: personalOrgSlug }],
        });

        if (personalOrg) {
          organizationId = personalOrg.id;
        } else {
          // Create personal organization if it doesn't exist
          const newOrg = await ctx.context.adapter.create<Organization>({
            model: "organization",
            data: {
              name: `${session.user.name || session.user.username}'s Workspace`,
              slug: personalOrgSlug,
              createdAt: new Date(),
            },
          });

          // Add user as owner
          await ctx.context.adapter.create({
            model: "member",
            data: {
              organizationId: newOrg.id,
              userId: session.user.id,
              role: "owner",
              createdAt: new Date(),
            },
          });

          organizationId = newOrg.id;
        }
      }

      // Check organization membership if provided
      if (organizationId) {
        if (!session?.user) {
          throw new APIError("UNAUTHORIZED", {
            message: "Authentication required for organization domains",
          });
        }

        const member = await ctx.context.adapter.findOne({
          model: "member",
          where: [
            { field: "organizationId", value: organizationId },
            { field: "userId", value: session.user.id },
          ],
        });

        if (!member) {
          throw new APIError("FORBIDDEN", {
            message: "You are not a member of this organization",
          });
        }
      }

      // Check if domain name already exists
      const existing = await ctx.context.adapter.findOne<Domain>({
        model: "domain",
        where: [{ field: "domainName", value: domainName }],
      });

      if (existing) {
        throw new APIError("CONFLICT", {
          message: "Domain name already exists",
        });
      }

      // Generate verification token
      const verificationToken = `JS.GS-verify-${generateVerificationToken()}`;

      const newDomain = {
        domainName,
        createdBy: session?.user?.id || null,
        updatedBy: session?.user?.id || null,
        organizationId: organizationId || null,
        status: "pending" as const,
        verificationToken,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const domain = await ctx.context.adapter.create<typeof newDomain & { id: string }>({
        model: "domain",
        data: newDomain,
      });

      return ctx.json(domain);
    },
  );
};
