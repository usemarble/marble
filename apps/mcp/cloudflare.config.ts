import { baseWorker } from "@marble/cf-config";
import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    ...baseWorker,
    name: "marble-mcp",
  },
});
