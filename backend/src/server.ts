import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectMongo } from "./db/mongo";
import { seedDatabase } from "./db/seed";
import { ensureChatsIndexes } from "./db/chats.repo";
import { initChatSocket } from "./realtime/chat.socket";
import { initNotificationsSocket } from "./realtime/notifications.socket"; // 👈
import { ensureReservationsIndexes } from "./db/reservations.repo";
import { ensureOrdersIndexes } from "./db/orders.repo";
import { seedAdmin } from "./db/seed-admin";
import { ensureMenuIndexes } from "./db/menu.repo";
import { startAutoArchiveJob } from "./jobs/autoArchiveOrders";
import { startStaleOrdersJob } from "./jobs/staleOrders";

async function bootstrap() {
  await connectMongo();
  await ensureChatsIndexes();
  await ensureReservationsIndexes();
  await ensureOrdersIndexes();
  await seedAdmin();
  await ensureMenuIndexes();

  if (env.AUTO_SEED) {
    await seedDatabase();
  }

  const app = createApp();
  const server = createServer(app);

  initChatSocket(server);        // creates the ONE Socket.IO instance
  initNotificationsSocket();     // 👈 attaches notification handlers to it (no server arg)

  server.listen(env.API_PORT, env.API_HOST, () => {
    console.log(`API running at http://${env.API_HOST}:${env.API_PORT}`);
  });
}

startAutoArchiveJob();
startStaleOrdersJob();

bootstrap().catch((error) => {
  console.error("Failed to start API:", error);
  process.exit(1);
});