import { proxyLiveBackendStream } from "@/lib/liveBackendClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const heartbeatStream = (cursor: string | null) => {
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("retry: 2000\n\n"));
      controller.enqueue(
        encoder.encode(`event: symposium-ready\ndata: ${JSON.stringify({ ok: true, cursor })}\n\n`)
      );
      heartbeat = setInterval(() => {
        controller.enqueue(
          encoder.encode(
            `event: symposium-heartbeat\ndata: ${JSON.stringify({
              ok: true,
              cursor,
              time: new Date().toISOString()
            })}\n\n`
          )
        );
      }, 15000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
    }
  });
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lastEventId = request.headers.get("last-event-id");
  if (lastEventId && !url.searchParams.has("cursor")) {
    url.searchParams.set("cursor", lastEventId);
  }
  const query = url.searchParams.toString();
  const live = await proxyLiveBackendStream(`/v1/events/stream${query ? `?${query}` : ""}`);
  if (live) return live;

  return new Response(heartbeatStream(url.searchParams.get("cursor")), {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
