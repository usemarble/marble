import { z } from "zod";
import { workspaceProcedure } from "../index";
import { getPublishingMetrics, getUsageMetrics } from "../services/metrics";

const workspaceInput = z.object({ workspaceId: z.string().min(1) });
const chartPoint = z.object({
  date: z.string(),
  label: z.string(),
  value: z.number(),
});
const usageDto = z.object({
  api: z.object({
    totals: z.object({
      total: z.number(),
      lastPeriod: z.number(),
      changePercentage: z.number(),
    }),
    chart: z.array(chartPoint),
  }),
  webhooks: z.object({
    total: z.number(),
    last7Days: z.number(),
    last24Hours: z.number(),
    topEndpoint: z.string().nullable(),
    topEndpointCount: z.number(),
    chart: z.array(chartPoint),
  }),
  media: z.object({
    total: z.number(),
    last30Days: z.number(),
    recentUploadsSize: z.number(),
    lastUploadAt: z.string().nullable(),
    recentUploads: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        size: z.number(),
        alt: z.string().nullable(),
        createdAt: z.string(),
        type: z.enum(["image", "video", "audio", "document"]),
        url: z.string(),
        mimeType: z.string().nullable(),
        width: z.number().nullable(),
        height: z.number().nullable(),
        duration: z.number().nullable(),
        blurHash: z.string().nullable(),
      })
    ),
  }),
});

export const metricsRouter = {
  usage: workspaceProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/metrics/usage",
      tags: ["Metrics"],
      summary: "Get dashboard usage metrics",
    })
    .input(workspaceInput)
    .output(usageDto)
    .handler(async ({ context }) =>
      usageDto.parse(await getUsageMetrics(context, context.workspaceId))
    ),
  publishing: workspaceProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/metrics/publishing",
      tags: ["Metrics"],
      summary: "Get this year's publishing activity",
    })
    .input(workspaceInput)
    .output(
      z.object({
        graph: z.object({
          activity: z.array(
            z.object({ date: z.string(), count: z.number(), level: z.number() })
          ),
        }),
      })
    )
    .handler(({ context }) =>
      getPublishingMetrics(context, context.workspaceId)
    ),
};
