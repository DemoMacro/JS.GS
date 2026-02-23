# use the official Node image
# see all versions at https://hub.docker.com/_/node/tags
FROM node:24-slim AS build
RUN corepack enable
WORKDIR /app

# Copy package.json and your lockfile, here we add pnpm-lock.yaml for illustration
COPY package.json pnpm-lock.yaml .npmrc ./

# use ignore-scripts to avoid running postinstall hooks
RUN pnpm install --frozen-lockfile

# Copy the entire project
COPY . .

# Build with node-cluster preset
ENV NITRO_PRESET=node_cluster
ENV NODE_ENV=production
ENV SKIP_MIGRATE=true
RUN pnpm run build

# Bundle migrate script into .output/scripts directory using rolldown
RUN pnpx rolldown --input ./scripts/migrate.ts --format esm --file ./.output/scripts/migrate.mjs --minify --platform node --inlineDynamicImports

# copy production dependencies and source code into final image
FROM node:24-slim AS production
WORKDIR /app

# Copy .output directory (which now contains migrate.mjs)
COPY --from=build /app/.output /app

# Set cluster workers
ENV NITRO_CLUSTER_WORKERS=max
ENV NODE_ENV=production
ENV PORT=3000

# run the app
EXPOSE 3000/tcp
ENTRYPOINT ["sh", "-c", "node /app/scripts/migrate.mjs && node /app/server/index.mjs"]
