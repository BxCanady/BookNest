import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://127.0.0.1:8000/graphql", // Rust backend URL
  documents: ["src/**/*.{ts,tsx}"], // where your queries live
  generates: {
    "./src/gql/": {
      preset: "client",
    },
  },
  ignoreNoDocuments: true,
};

export default config;
