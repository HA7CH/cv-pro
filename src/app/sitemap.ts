import type { MetadataRoute } from "next";
import { supabaseAnon } from "@/lib/supabase/client";

const BASE_URL = "https://cv.ha7ch.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await supabaseAnon
    .from("cv_resumes")
    .select("username, updated_at");

  const userPages: MetadataRoute.Sitemap = (data ?? []).map((row) => ({
    url: `${BASE_URL}/${row.username}`,
    lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...userPages,
  ];
}
