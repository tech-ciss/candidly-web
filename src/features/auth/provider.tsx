'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { SessionManager } from './session';
const Context = createContext<SessionManager | null>(null);
const serverSnapshot = { status: 'initializing' as const, user: null };
let browserManager: SessionManager | undefined;
function getBrowserManager() {
  if (typeof window === 'undefined') return null;
  return (browserManager ??= new SessionManager());
}
export function AuthProvider({
  children,
  manager,
}: {
  children: React.ReactNode;
  manager?: SessionManager;
}) {
  const [session] = useState(() => manager ?? getBrowserManager());
  useEffect(() => {
    if (session) void session.initialize().catch(() => undefined);
  }, [session]);
  return <Context.Provider value={session}>{children}</Context.Provider>;
}
export function useAuth() {
  const session = useContext(Context);
  const snapshot = useSyncExternalStore(
    session?.subscribe ?? (() => () => {}),
    session?.getSnapshot ?? (() => serverSnapshot),
    () => serverSnapshot,
  );
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return { session: hydrated ? session : null, ...snapshot };
}
