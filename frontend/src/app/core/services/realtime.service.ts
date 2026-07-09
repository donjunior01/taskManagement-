import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';

/**
 * Thin STOMP-over-SockJS client for server-pushed real-time events (currently: wiki live-refresh).
 * Lazily connects on first subscribe, auto-reconnects, and re-establishes subscriptions on reconnect.
 * Best-effort: if the socket can't connect, the app keeps working over plain HTTP.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private client?: Client;
  private connected = false;
  private handlers = new Map<string, { cb: (msg: any) => void; sub?: StompSubscription }>();

  private wsUrl(): string {
    // http://host:8073/api -> http://host:8073/ws
    return environment.apiUrl.replace(/\/api\/?$/, '') + '/ws';
  }

  private ensureClient(): void {
    if (this.client) return;
    this.client = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl()) as any,
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
        this.handlers.forEach((_, topic) => this.doSubscribe(topic));
      },
      onWebSocketClose: () => { this.connected = false; },
      onStompError: () => { this.connected = false; }
    });
    this.client.activate();
  }

  private doSubscribe(topic: string): void {
    const entry = this.handlers.get(topic);
    if (!entry || !this.client) return;
    entry.sub = this.client.subscribe(topic, (m: IMessage) => {
      let payload: any = m.body;
      try { payload = JSON.parse(m.body); } catch { /* keep raw string */ }
      entry.cb(payload);
    });
  }

  /** Subscribe to a STOMP topic. Returns an unsubscribe function. */
  subscribe(topic: string, cb: (msg: any) => void): () => void {
    this.ensureClient();
    this.handlers.set(topic, { cb });
    if (this.connected) this.doSubscribe(topic);
    return () => {
      const entry = this.handlers.get(topic);
      try { entry?.sub?.unsubscribe(); } catch { /* ignore */ }
      this.handlers.delete(topic);
    };
  }
}
