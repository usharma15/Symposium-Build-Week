import type { FastifyInstance } from "fastify";
import { sendError } from "../http/errors";
import { eventIsAfterCursor, listEventsSince, type StoredLiveEvent } from "../services/events";
import { subscribeLocalLiveEvents } from "../services/liveBus";

type EventQuery = {
  cursor?: string;
  limit?: string;
};

const limitFromQuery = (value?: string) => {
  const parsed = Number(value ?? 50);
  return Number.isFinite(parsed) ? parsed : 50;
};

export const registerEventRoutes = (app: FastifyInstance) => {
  app.get<{ Querystring: EventQuery }>("/v1/events", async (request, reply) => {
    try {
      const events = await listEventsSince(request.query.cursor, limitFromQuery(request.query.limit));
      const cursor = events.at(-1)?.cursor ?? request.query.cursor ?? null;
      return reply.send({ events, cursor });
    } catch (error) {
      return sendError(app, reply, error);
    }
  });

  app.get<{ Querystring: EventQuery }>("/v1/events/stream", async (request, reply) => {
    reply.hijack();

    const stream = reply.raw;
    const lastEventId = request.headers["last-event-id"];
    let cursor = request.query.cursor ?? (Array.isArray(lastEventId) ? lastEventId[0] : lastEventId) ?? null;
    let closed = false;

    const send = (eventName: string, data: unknown, id?: string) => {
      if (closed || stream.destroyed) return;
      if (id) stream.write(`id: ${id}\n`);
      stream.write(`event: ${eventName}\n`);
      stream.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const sendLiveEvent = (event: StoredLiveEvent) => {
      if (!eventIsAfterCursor(event, cursor)) return;
      cursor = event.cursor;
      send("symposium-event", event, event.cursor);
    };

    const flushMissedEvents = async () => {
      const events = await listEventsSince(cursor, limitFromQuery(request.query.limit));
      for (const event of events) sendLiveEvent(event);
    };

    stream.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    stream.write("retry: 2000\n\n");

    const unsubscribe = subscribeLocalLiveEvents((event) => {
      if ((event.visibility ?? "public") !== "public") return;
      sendLiveEvent(event);
    });
    const poll = setInterval(() => {
      void flushMissedEvents().catch((error) => {
        app.log.warn(error, "Could not flush missed live events.");
      });
    }, 2000);
    const heartbeat = setInterval(() => {
      send("symposium-heartbeat", { ok: true, cursor, time: new Date().toISOString() });
    }, 15000);

    const cleanup = () => {
      closed = true;
      unsubscribe();
      clearInterval(poll);
      clearInterval(heartbeat);
    };

    request.raw.on("close", cleanup);
    stream.on("error", cleanup);

    await flushMissedEvents().catch((error) => {
      app.log.warn(error, "Could not send initial live events.");
    });
    send("symposium-ready", { ok: true, cursor });
  });
};
