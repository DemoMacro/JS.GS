import { toStartOfInterval, rawAs } from "@hypequery/clickhouse";
import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { z } from "zod";

import { chdb } from "../../../../../server/utils/database";
import type { Link } from "../../../../types/link";
import { canAccessLink } from "../permissions";

// GroupBy options matching Dub.co API
const AnalyticsGroupBySchema = z.enum([
  "count",
  "timeseries",
  "countries",
  "cities",
  "devices",
  "browsers",
  "os",
  "utm_sources",
  "utm_mediums",
  "utm_campaigns",
  "utm_terms",
  "utm_contents",
  "referers",
]);

const AnalyticsQuerySchema = z.object({
  linkId: z.string(),
  groupBy: AnalyticsGroupBySchema.default("count"),
  start: z.string().optional(),
  end: z.string().optional(),
});

export const getAnalytics = () => {
  return createAuthEndpoint(
    "/link/analytics",
    {
      method: "GET",
      query: AnalyticsQuerySchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description:
            "Retrieve analytics for a link. Unique visitors are calculated using a privacy-compliant 'soft fingerprint' combining anonymized IP, browser version, OS version, device vendor, and model. This provides better accuracy than IP-only counting while remaining GDPR compliant.",
          responses: {
            "200": {
              description: "Analytics retrieved successfully",
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

      const { linkId, groupBy, start, end } = ctx.query;

      // Verify link exists and user has access
      const link = await ctx.context.adapter.findOne<Link>({
        model: "link",
        where: [{ field: "id", value: linkId }],
      });

      if (!link) {
        throw new APIError("NOT_FOUND", {
          message: "Link not found",
        });
      }

      const hasAccess = await canAccessLink(ctx, link, session);
      if (!hasAccess) {
        throw new APIError("FORBIDDEN", {
          message: "You do not have access to this link",
        });
      }

      // Build base query with linkId filter
      const buildBaseQuery = () => {
        let query = chdb.table("clickEvents").where("linkId", "eq", linkId);
        if (start) {
          // @ts-ignore - ClickHouse type complexity is too high for TypeScript inference
          query = query.where("timestamp", "gte", start);
        }
        if (end) {
          query = query.where("timestamp", "lte", end);
        }
        return query;
      };

      // Execute query based on groupBy
      switch (groupBy) {
        case "count": {
          const countResult = await buildBaseQuery().count("id", "totalClicks").execute();

          // Query unique visitors using "soft fingerprint" combination
          // Combines: ip (anonymized) + browserMajor + osVersion + deviceVendor + deviceModel
          // This provides better accuracy than IP alone while remaining GDPR compliant
          const uniqueResult = await buildBaseQuery()
            .select([
              rawAs(
                "uniqExact(concat(ip, '|', browserMajor, '|', osVersion, '|', deviceVendor, '|', deviceModel))",
                "uniqueVisitors",
              ),
            ])
            .execute();

          return ctx.json({
            totalClicks: countResult[0]?.totalClicks ?? 0,
            uniqueVisitors: uniqueResult[0]?.uniqueVisitors
              ? Number(uniqueResult[0].uniqueVisitors)
              : 0,
          });
        }

        case "timeseries": {
          // Return hourly aggregated data as finest granularity
          // Frontend will aggregate hours into days/weeks/months as needed
          const query = buildBaseQuery()
            .select([toStartOfInterval("timestamp", "1 hour", "timestamp")])
            .count("id", "clicks")
            .groupBy("timestamp")
            .orderBy("timestamp", "ASC");

          const results = await query.execute();
          return ctx.json({ data: results });
        }

        case "countries": {
          const results = await buildBaseQuery()
            .select(["country"])
            .count("id", "clicks")
            .groupBy("country")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        case "cities": {
          const results = await buildBaseQuery()
            .select(["city"])
            .count("id", "clicks")
            .groupBy("city")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        case "devices": {
          const results = await buildBaseQuery()
            .select(["deviceType"])
            .count("id", "clicks")
            .groupBy("deviceType")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        case "browsers": {
          const results = await buildBaseQuery()
            .select(["browserName"])
            .count("id", "clicks")
            .groupBy("browserName")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        case "os": {
          const results = await buildBaseQuery()
            .select(["osName"])
            .count("id", "clicks")
            .groupBy("osName")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        case "utm_sources": {
          const results = await buildBaseQuery()
            .select(["utmSource"])
            .count("id", "clicks")
            .groupBy("utmSource")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        case "utm_mediums": {
          const results = await buildBaseQuery()
            .select(["utmMedium"])
            .count("id", "clicks")
            .groupBy("utmMedium")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        case "utm_campaigns": {
          const results = await buildBaseQuery()
            .select(["utmCampaign"])
            .count("id", "clicks")
            .groupBy("utmCampaign")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        case "utm_terms": {
          const results = await buildBaseQuery()
            .select(["utmTerm"])
            .count("id", "clicks")
            .groupBy("utmTerm")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        case "utm_contents": {
          const results = await buildBaseQuery()
            .select(["utmContent"])
            .count("id", "clicks")
            .groupBy("utmContent")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        case "referers": {
          const results = await buildBaseQuery()
            .select(["referrer"])
            .count("id", "clicks")
            .groupBy("referrer")
            .orderBy("clicks", "DESC")
            .execute();
          return ctx.json({ data: results });
        }

        default:
          throw new APIError("BAD_REQUEST", {
            message: "Invalid groupBy parameter",
          });
      }
    },
  );
};
