import { apiKey } from "@better-auth/api-key";
import { betterAuth, type BetterAuthOptions, APIError } from "better-auth";
import { username, admin, organization, openAPI } from "better-auth/plugins";
import { toNumber, isValidIP } from "ipdo";
import { Pool } from "pg";
import reservedUsernames from "reserved-usernames";
import { env } from "std-env";

import { domain } from "../../../shared/utils/auth/domain";
import { link } from "../../../shared/utils/auth/link";
import { cacheStorage } from "../../../shared/utils/storage";
import { db } from "../database";
import { sendEmail } from "../email/resend";

/**
 * Normalize better-auth secondary storage keys for unstorage compatibility
 *
 * Better-auth uses format: {ip}|{path}
 * For example: 0000:0000:0000:0000:0000:0000:0000:0000|/sign-in/username
 *
 * This function converts IPv6 addresses to compressed format (e.g., ::1 instead of full zeros),
 * converts IPv4 addresses to integer for shorter keys, and replaces | with : and / with -
 * for filesystem compatibility.
 */
function normalizeKey(key: string): string {
  const parts = key.split("|");
  if (parts.length !== 2) return key;

  const [ipPart, pathPart] = parts;
  if (!ipPart || !pathPart) return key;

  // Normalize IP address
  let normalizedIP: string;
  if (!isValidIP(ipPart)) {
    // Not a valid IP, use as-is
    normalizedIP = ipPart;
  } else {
    // Convert IP to number for shorter keys (works for both IPv4 and IPv6)
    const num = toNumber(ipPart);
    normalizedIP = num.toString();
  }

  // Replace unsupported characters
  // | (pipe) -> : (colon)
  // / (slash) -> - (dash)
  return `${normalizedIP}:${pathPart.replace(/\//g, "-")}`;
}

export const authConfig = {
  basePath: "/api",
  baseURL: env.BETTER_AUTH_URL,
  database: new Pool({
    connectionString: env.DATABASE_URL,
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
    // Configure IP address detection for rate limiting
    // This aligns with the IP detection logic in server/utils/analytics/track.ts
    ipAddress: {
      ipAddressHeaders: [
        // Most reliable - Cloudflare Enterprise
        "true-client-ip",
        // Platform-specific headers
        "cf-connecting-ip", // Cloudflare
        "x-vercel-forwarded-for", // Vercel
        "fly-client-ip", // Fly.io
        "fastly-client-ip", // Fastly
        // Generic headers
        "x-forwarded-for", // Standard proxy/load balancer
        "x-real-ip", // Nginx/Apache
        "x-client-ip", // Some proxies
      ],
    },
    // Trust proxy headers for correct base URL inference
    // Enable this when deploying behind reverse proxies (Cloudflare, Nginx, etc.)
    trustedProxyHeaders: true,
  },
  experimental: { joins: true },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Use void to avoid blocking - recommended by better-auth to prevent timing attacks
      void sendEmail({
        user,
        subject: "Reset Your Password",
        text: `Please click the following link to reset your password:\n\n${url}\n\nIf you did not request a password reset, please ignore this email.\nThis link will expire in 1 hour.`,
      });
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Use void to avoid blocking - recommended by better-auth to prevent timing attacks
      void sendEmail({
        user,
        subject: "Verify your JS.GS email address",
        text: `Please click the following link to verify your email address:\n\n${url}\n\nIf you did not register for a JS.GS account, please ignore this email.\nThis link will expire in 1 hour.`,
      });
    },
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600, // 1 hour
  },
  secondaryStorage: {
    get: async (key: string) => {
      const normalizedKey = normalizeKey(key);
      return await cacheStorage.getItem(normalizedKey);
    },
    set: async (key: string, value: string, ttl?: number) => {
      const normalizedKey = normalizeKey(key);
      if (ttl) {
        await cacheStorage.setItem(normalizedKey, value, { ttl: Math.floor(ttl) });
      } else {
        await cacheStorage.setItem(normalizedKey, value);
      }
    },
    delete: async (key: string) => {
      const normalizedKey = normalizeKey(key);
      await cacheStorage.removeItem(normalizedKey);
    },
  },
  // Database hooks for automatic personal organization creation
  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx) => {
          // Automatically create personal organization after user registration
          try {
            const personalOrgSlug = `user_${user.id}`;
            const userName = (user.name as string | undefined) || (user.username as string);
            const personalOrgName = `${userName}'s Workspace`;

            console.log(
              `Creating personal organization for user ${String(user.username)}: ${personalOrgSlug}`,
            );

            // Create personal organization using adapter
            const organization = await ctx?.context.adapter.create({
              model: "organization",
              data: {
                name: personalOrgName,
                slug: personalOrgSlug,
              },
            });

            if (!organization) {
              throw new Error("Failed to create personal organization");
            }

            // Add user as owner
            await ctx?.context.adapter.create({
              model: "member",
              data: {
                organizationId: organization.id,
                userId: user.id,
                role: "owner",
                createdAt: new Date(),
              },
            });

            console.log(
              `✅ Created personal organization for user ${String(user.username)}: ${personalOrgSlug}`,
            );
          } catch (error) {
            // Don't block user registration, just log the error
            console.error("Failed to create personal organization:", error);
          }
        },
      },
    },
  },

  plugins: [
    username({
      minUsernameLength: 5, // Must be more than 4 characters
      maxUsernameLength: 30,
      usernameValidator: (username) => {
        const lowerUsername = username.toLowerCase();

        // Allow admin username specified in environment variable
        if (env.ADMIN_USERNAME && lowerUsername === env.ADMIN_USERNAME.toLowerCase()) {
          return true;
        }

        // Check against reserved usernames list
        if (reservedUsernames.indexOf(lowerUsername) !== -1) {
          return false;
        }

        // Character set validation: only letters, numbers, underscores, and hyphens
        return /^[a-zA-Z0-9_-]+$/.test(username);
      },
      displayUsernameValidator: (displayUsername) => {
        // Display name uses the same character set restrictions
        return /^[a-zA-Z0-9_-]+$/.test(displayUsername);
      },
    }),
    admin(),
    apiKey({
      enableSessionForAPIKeys: true,
      storage: "secondary-storage",
      fallbackToDatabase: true,
    }),
    organization({
      organizationHooks: {
        beforeCreateOrganization: async ({ organization }) => {
          // Prevent creating organizations with user_ prefix (reserved for personal orgs)
          const slug = organization.slug;
          if (slug?.startsWith("user_")) {
            throw new APIError("BAD_REQUEST", {
              message:
                "Organization slug cannot start with 'user_'. This format is reserved for personal organizations.",
            });
          }
          return { data: organization };
        },
        beforeUpdateOrganization: async ({ organization, member }) => {
          // If the request contains slug update
          if (organization.slug) {
            // Prevent normal organizations from using user_ prefix
            if (organization.slug.startsWith("user_")) {
              throw new APIError("BAD_REQUEST", {
                message:
                  "Organization slug cannot start with 'user_'. This format is reserved for personal organizations.",
              });
            }

            // Query current organization to check if it's a personal org
            const currentOrg = await db
              .selectFrom("organization")
              .where("id", "=", member.organizationId)
              .select("slug")
              .executeTakeFirst();

            // If it's a personal org, silently remove slug from update (allow other fields)
            if (currentOrg?.slug?.startsWith("user_")) {
              const { slug: _slug, ...filteredData } = organization;
              return { data: filteredData };
            }
          }

          // Pass through for all other cases
          return { data: organization };
        },
        beforeDeleteOrganization: async ({ organization }) => {
          // Protect personal organizations from being deleted
          const slug = organization.slug;
          if (slug?.startsWith("user_")) {
            throw new APIError("FORBIDDEN", {
              message: "Cannot delete personal organization.",
            });
          }
        },
        beforeRemoveMember: async ({ member, organization }) => {
          // Protect personal organization owners from being removed
          const slug = organization.slug;
          if (slug?.startsWith("user_") && member.role === "owner") {
            throw new APIError("FORBIDDEN", {
              message: "Cannot remove owner from personal organization.",
            });
          }
        },
        beforeUpdateMemberRole: async ({ member, organization }) => {
          // Protect personal organization owner roles from being changed
          const slug = organization.slug;
          if (slug?.startsWith("user_") && member.role === "owner") {
            throw new APIError("FORBIDDEN", {
              message: "Cannot modify owner role in personal organization.",
            });
          }
        },
      },
    }),
    openAPI({
      disableDefaultReference: true,
    }),
    domain(),
    link(),
  ],
  rateLimit: {
    enabled: true,
    customRules: {
      "/link/create": {
        window: 60,
        max: 100,
      },
    },
    storage: "secondary-storage",
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    changeEmail: {
      enabled: true,
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth(authConfig);
