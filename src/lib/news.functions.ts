import { createServerFn } from "@tanstack/react-start";

export const getLiveNews = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchLiveNews } = await import("./news.server");
  const items = await fetchLiveNews();
  return { items, fetchedAt: new Date().toISOString() };
});
