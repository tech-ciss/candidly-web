'use client';
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  Fragment,
} from 'react';
import { useAuth } from '@/features/auth/provider';
import { companiesApi } from '@/features/companies/api';
import { contactsApi } from '@/features/contacts/api';
import { CrmStore } from './store';
const Context = createContext<CrmStore | null>(null);
export function CrmProvider({ children }: { children: React.ReactNode }) {
  const { session, user } = useAuth();
  if (!session || !user) return null;
  return (
    <OwnedProvider key={user.id} session={session} owner={user.id}>
      {children}
    </OwnedProvider>
  );
}
function OwnedProvider({
  session,
  owner,
  children,
}: {
  session: CrmStore['session'];
  owner: string;
  children: React.ReactNode;
}) {
  const [store] = useState(() => new CrmStore(session, owner));
  useLayoutEffect(() => store.connect(), [store]);
  const epoch = useSyncExternalStore(
    store.subscribe,
    store.getEpoch,
    store.getEpoch,
  );
  return (
    <Context.Provider value={store}>
      <Fragment key={epoch}>{children}</Fragment>
    </Context.Provider>
  );
}
export function useCrm() {
  const store = useContext(Context);
  if (!store) throw new Error('CRM provider absent');
  return useMemo(
    () => ({
      store,
      companies: companiesApi(store.session),
      contacts: contactsApi(store.session),
    }),
    [store],
  );
}
export function useCrmQuery<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
) {
  const { store } = useCrm();
  const fetchRef = useRef(fetcher);
  useEffect(() => {
    fetchRef.current = fetcher;
  });
  const state = useSyncExternalStore(
    store.subscribe,
    () => store.get<T>(key),
    () => store.get<T>(key),
  );
  useEffect(() => {
    if (state.status === 'idle')
      void store.load(key, (signal) => fetchRef.current(signal));
  }, [store, key, state.status]);
  return { ...state, retry: () => store.retry(key) };
}
export function useCrmAction() {
  const { store } = useCrm();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function run<T>(fn: () => Promise<T>, success: (value: T) => void) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(undefined);
    try {
      await store.mutate(fn, (value) => {
        if (mounted.current) success(value);
      });
    } catch (e) {
      if (mounted.current) setError(e);
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return { pending, error, run };
}
