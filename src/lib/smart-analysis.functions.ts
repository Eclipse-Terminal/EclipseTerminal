import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runSmartAnalysis } from "@/lib/smart-analysis.server";

const SnapshotSchema = z.object({
  symbol: z.string(),
  tvSymbol: z.string(),
  nameAr: z.string(),
  sectorAr: z.string(),
  price: z.number(),
  changePct: z.number(),
  volume: z.number(),
  support: z.number(),
  resistance: z.number(),
});

export const analyzeLiveSnapshot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SnapshotSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      return await runSmartAnalysis(data);
    } catch (error) {
      return { text: "", error: error instanceof Error ? error.message : "AI request failed" };
    }
  });
