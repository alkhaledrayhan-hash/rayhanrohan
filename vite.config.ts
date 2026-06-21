import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { imagetools } from "vite-imagetools";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || "";

  return {
    tanstackStart: {
      server: { entry: "server" },
    },
    nitro: { preset: "vercel" },
    vite: {
      define: {
        "process.env.SUPABASE_URL": JSON.stringify(supabaseUrl),
        "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
      },
      plugins: [imagetools()],
    },
  };
});
