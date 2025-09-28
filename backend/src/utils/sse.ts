import { Response } from 'express';

type SseEventName =
  | 'comment_created'
  | 'comment_updated'
  | 'comment_deleted'
  | 'comment_approved'
  | 'comment_unapproved'
  | 'connected'
  | 'heartbeat';

const clientsByPostId: Map<number, Set<Response>> = new Map();

const writeEvent = (res: Response, event: SseEventName, data?: unknown): void => {
  try {
    res.write(`event: ${event}\n`);
    if (data !== undefined) {
      res.write(`data: ${JSON.stringify(data)}\n`);
    } else {
      res.write('data: {}\n');
    }
    res.write('\n');
  } catch (_) {
    // Ignore write errors; connection likely closed
  }
};

export const subscribe = (postId: number, res: Response): (() => void) => {
  if (!clientsByPostId.has(postId)) {
    clientsByPostId.set(postId, new Set());
  }
  const set = clientsByPostId.get(postId)!;
  set.add(res);

  // initial event
  writeEvent(res, 'connected', { postId, timestamp: Date.now() });

  const heartbeat = setInterval(() => writeEvent(res, 'heartbeat', { t: Date.now() }), 25000);

  const unsubscribe = () => {
    clearInterval(heartbeat);
    const current = clientsByPostId.get(postId);
    if (current) {
      current.delete(res);
      if (current.size === 0) clientsByPostId.delete(postId);
    }
    try {
      res.end();
    } catch {}
  };

  return unsubscribe;
};

export const publish = (postId: number, event: SseEventName, payload: unknown): void => {
  const set = clientsByPostId.get(postId);
  if (!set || set.size === 0) return;
  for (const res of set) {
    writeEvent(res, event, payload);
  }
};

// Specific helpers for comments
export const publishCommentEvent = (
  postId: number,
  event: Extract<SseEventName, 'comment_created' | 'comment_updated' | 'comment_deleted' | 'comment_approved' | 'comment_unapproved'>,
  payload: unknown
) => publish(postId, event, payload);


