import { defineConfig } from "orval";

export default defineConfig({
  reana: {
    input: {
      target: "../../reana-server/docs/openapi.json",
    },
    output: {
      target: "./src/api/generated.ts",
      client: "react-query",
      override: {
        mutator: {
          path: "./src/api/axiosInstance.ts",
          name: "customAxiosInstance",
        },
      },
    },
  },
});
