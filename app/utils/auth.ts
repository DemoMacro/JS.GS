import { createAuthClient } from "better-auth/vue";
import { usernameClient, adminClient, organizationClient } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";
import { linkClient } from "~~/shared/utils/auth/link/client";
import { domainClient } from "~~/shared/utils/auth/domain/client";

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
