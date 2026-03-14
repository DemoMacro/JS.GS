import { apiKeyClient } from "@better-auth/api-key/client";
import { usernameClient, adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";
import { domainClient } from "~~/shared/utils/auth/domain/client";
import { linkClient } from "~~/shared/utils/auth/link/client";

export const authClient = createAuthClient({
  basePath: "/api",
  plugins: [
    usernameClient(),
    adminClient(),
    apiKeyClient(),
    organizationClient(),
    linkClient(),
    domainClient(),
  ],
});
