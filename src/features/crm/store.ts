import type { SessionManager } from '@/features/auth/session';
import { ApiError } from '@/lib/api/client';
export interface QueryState<T> {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data?: T;
  error?: unknown;
}
const idle: QueryState<never> = { status: 'idle' };
interface Entry {
  state: QueryState<unknown>;
  controller?: AbortController;
  promise?: Promise<void>;
}
/** Private, ephemeral cache. Session transitions synchronously discard every response and draft. */
export class CrmStore {
  private entries = new Map<string, Entry>();
  private listeners = new Set<() => void>();
  private revision = 0;
  private epoch = 0;
  private active = false;
  private disconnect?: () => void;
  constructor(
    readonly session: SessionManager,
    readonly owner: string,
  ) {
    const s = session.getSnapshot();
    this.active = s.status === 'authenticated' && s.user?.id === owner;
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getEpoch = () => this.epoch;
  get<T>(key: string): QueryState<T> {
    return (this.entries.get(key)?.state ?? idle) as QueryState<T>;
  }
  private emit() {
    this.listeners.forEach((fn) => fn());
  }
  private clear() {
    this.revision++;
    for (const e of this.entries.values()) e.controller?.abort();
    this.entries.clear();
  }
  connect() {
    const sync = () => {
      const s = this.session.getSnapshot();
      const active = s.status === 'authenticated' && s.user?.id === this.owner;
      if (!active) {
        this.clear();
        this.epoch++;
      }
      this.active = active;
      this.emit();
    };
    this.disconnect = this.session.subscribe(sync);
    sync();
    return () => {
      this.disconnect?.();
      this.active = false;
      this.clear();
    };
  }
  invalidate() {
    this.clear();
    this.emit();
  }
  retry(key: string) {
    const e = this.entries.get(key);
    e?.controller?.abort();
    this.entries.delete(key);
    this.emit();
  }
  load<T>(
    key: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
  ): Promise<void> {
    if (!this.active) return Promise.resolve();
    const existing = this.entries.get(key);
    if (existing?.promise) return existing.promise;
    const revision = this.revision;
    const controller = new AbortController();
    const entry: Entry = { state: { status: 'loading' }, controller };
    this.entries.set(key, entry);
    entry.promise = Promise.resolve()
      .then(() => fetcher(controller.signal))
      .then(
        (data) => {
          if (
            this.active &&
            revision === this.revision &&
            this.entries.get(key) === entry
          )
            entry.state = { status: 'ready', data };
        },
        (error) => {
          if (
            this.active &&
            revision === this.revision &&
            this.entries.get(key) === entry
          )
            entry.state = { status: 'error', error };
        },
      )
      .finally(() => {
        entry.promise = undefined;
        this.emit();
      });
    this.emit();
    return entry.promise;
  }
  async mutate<T>(
    operation: () => Promise<T>,
    confirmed?: (value: T) => void,
  ): Promise<T> {
    const epoch = this.epoch;
    if (!this.active)
      throw new ApiError('Session terminée.', 401, 'UNAUTHORIZED');
    const result = await operation();
    if (!this.active || epoch !== this.epoch)
      throw new ApiError('Session terminée.', 401, 'UNAUTHORIZED');
    confirmed?.(result);
    this.invalidate();
    return result;
  }
}
