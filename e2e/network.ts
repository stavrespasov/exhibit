const target = new URL(process.env.QA_BASE_URL ?? "http://127.0.0.1:3000");
const server = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
export const qaProxy = server && !["localhost", "127.0.0.1", "::1"].includes(target.hostname)
  ? { server, bypass: "localhost,127.0.0.1" }
  : undefined;
