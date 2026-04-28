import Fastify from "fastify";

export const buildApp = () => {
  const app = Fastify();

  app.get("/health", async () => ({ status: "ok" }));

  return app;
};
