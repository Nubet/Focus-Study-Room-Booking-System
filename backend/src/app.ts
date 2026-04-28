import Fastify from "fastify";
import { registerReservationsRoutes } from "./api/routes/reservations-routes.js";

export const buildApp = () => {
  const app = Fastify();

  app.get("/health", async () => ({ status: "ok" }));
  registerReservationsRoutes(app);

  return app;
};
