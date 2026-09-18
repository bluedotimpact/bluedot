import {
  type ReactNode, useCallback, useEffect, useRef, useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  CTALinkOrButton, H1, Modal, useAuthStore,
} from '@bluedot/ui';
import { apps } from '../lib/apps';
import { isLocalPreview, PREVIEW_EMAIL, PREVIEW_TOKEN } from '../lib/preview';
import { useNavigationState } from '../lib/client/navigation';
import { PortalIcon } from './PortalIcon';

const SIDEBAR_KEY = 'bluedot-apps:sidebar-collapsed';

export const PortalLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { auth, setAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [leaveAction, setLeaveAction] = useState<(() => void) | null>(null);
  const pendingWrites = useNavigationState((state) => state.pendingWrites);
  const menuButton = useRef<HTMLButtonElement>(null);
  const historyPosition = useRef(0);
  const historyEntries = useRef(new Map<string, number>());
  const restoringHistory = useRef<(() => void) | null>(null);
  const approvedHistory = useRef(false);
  const activeApp = apps.find((app) => router.pathname === app.href);
  const isLogin = router.pathname.startsWith('/login');
  const preview = isLocalPreview();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === 'true');
    } catch { /* Storage can be disabled. */ }
  }, []);

  const requestLeave = useCallback((action: () => void) => {
    const state = useNavigationState.getState();
    if (state.sessionActive || state.pendingWrites > 0) setLeaveAction(() => action);
    else action();
  }, []);

  useEffect(() => {
    const onUnload = (event: BeforeUnloadEvent) => {
      const state = useNavigationState.getState();
      if (state.sessionActive || state.pendingWrites > 0) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const markEntry = () => {
      const key = window.history.state?.key as string | undefined;
      const position = (key ? historyEntries.current.get(key) : undefined)
        ?? window.history.state?.portalPosition as number | undefined;
      if (position !== undefined) {
        historyPosition.current = position;
      } else {
        historyPosition.current += 1;
      }

      if (key) historyEntries.current.set(key, historyPosition.current);
      window.history.replaceState({ ...window.history.state, portalPosition: historyPosition.current }, '');
    };

    markEntry();

    window.addEventListener('beforeunload', onUnload);
    router.events.on('routeChangeComplete', markEntry);
    router.beforePopState(({ as }) => {
      if (restoringHistory.current) {
        const restored = restoringHistory.current;
        restoringHistory.current = null;
        restored();
        return false;
      }

      const key = window.history.state?.key as string | undefined;
      const targetPosition = (key ? historyEntries.current.get(key) : undefined)
        ?? window.history.state?.portalPosition as number | undefined;
      // Next replaces custom history state on an accepted pop. Retain it by its stable key.
      if (key && targetPosition !== undefined) historyEntries.current.set(key, targetPosition);
      const state = useNavigationState.getState();
      if (approvedHistory.current || (!state.sessionActive && state.pendingWrites === 0)) {
        approvedHistory.current = false;
        return true;
      }

      const delta = targetPosition === undefined ? 1 : historyPosition.current - targetPosition;
      // Restore first, then ask. Approval traverses to the original entry without adding a new one.
      restoringHistory.current = () => requestLeave(() => {
        if (targetPosition === undefined || delta === 0) {
          void router.push(as);
        } else {
          approvedHistory.current = true;
          window.history.go(-delta);
        }
      });
      window.history.go(delta || 1);
      return false;
    });
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      router.events.off('routeChangeComplete', markEntry);
      router.beforePopState(() => true);
    };
  }, [router, requestLeave]);

  useEffect(() => {
    useNavigationState.setState({ promptOpen: leaveAction !== null || mobileOpen });
    return () => {
      useNavigationState.setState({ promptOpen: false });
    };
  }, [leaveAction, mobileOpen]);

  const toggleCollapsed = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_KEY, String(next));
    } catch { /* The preference remains in memory. */ }
  }, [collapsed]);

  useEffect(() => {
    if (!auth) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { activeElement } = document;
      if (activeElement instanceof HTMLElement
        && (['INPUT', 'TEXTAREA'].includes(activeElement.tagName) || activeElement.isContentEditable)) return;

      const isSidebarToggle = event.code === 'KeyB'
        && !event.altKey && !event.shiftKey
        && ((event.metaKey && !event.ctrlKey) || (event.ctrlKey && !event.metaKey));
      if (isSidebarToggle) {
        event.preventDefault();
        toggleCollapsed();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [auth, toggleCollapsed]);

  const navigation = (compact: boolean) => (
    <nav aria-label="Apps" className="flex flex-col gap-1">
      {[{
        name: 'Home', href: '/', id: 'home', icon: 'home' as const, external: false,
      }, ...apps].map((app) => (
        <Link
          key={app.id}
          href={app.href}
          target={app.external ? '_blank' : undefined}
          rel={app.external ? 'noopener noreferrer' : undefined}
          aria-label={app.external ? `${app.name} (opens in a new tab)` : app.name}
          aria-current={router.pathname === app.href ? 'page' : undefined}
          title={compact ? app.name : undefined}
          onClick={(event) => {
            if (app.external) {
              setMobileOpen(false);
              return;
            }

            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            if (router.pathname === app.href) {
              setMobileOpen(false);
              return;
            }

            requestLeave(() => {
              setMobileOpen(false);
              void router.push(app.href);
            });
          }}
          className={`flex min-h-11 items-center gap-3 rounded-surface px-3 text-size-xs font-medium transition-colors ${compact ? 'justify-center' : ''} ${router.pathname === app.href ? 'bg-active text-primary' : 'text-secondary hover:bg-tint hover:text-primary'}`}
        >
          <PortalIcon name={app.icon} className="shrink-0" />
          {!compact && <><span>{app.name}</span>{app.external && <PortalIcon name="external" className="ml-auto size-3.5 shrink-0" />}</>}
        </Link>
      ))}
    </nav>
  );

  const signOut = () => requestLeave(() => {
    setAuth(null);
    setMobileOpen(false);
    void router.replace('/');
  });

  return (
    <div className="bluedot-base flex min-h-dvh">
      <a href="#app-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-70 focus:rounded-surface focus:bg-raised focus:p-3">Skip to content</a>
      {auth && <aside aria-label="Workspace" className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-subtle bg-canvas p-3 md:flex ${collapsed ? 'w-18' : 'w-60'}`}>
        <div className={`flex h-16 items-center gap-2.5 px-3 ${collapsed ? 'justify-center' : ''}`}>
          <span className="size-3 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          {!collapsed && <span className="text-size-md font-semibold tracking-tight">BlueDot <span className="font-normal text-secondary">Apps</span></span>}
          {collapsed && <span className="sr-only">BlueDot Apps</span>}
        </div>
        <div className="mt-5">{navigation(collapsed)}</div>
        <div className="mt-auto space-y-2 pt-6">
          {auth && (
            <div className={`flex items-center gap-2 rounded-surface ${collapsed ? 'flex-col' : 'px-2'}`}>
              {!collapsed && <div className="min-w-0 flex-1"><p className="text-size-xs font-medium">{preview ? 'Local preview' : 'Signed in'}</p><p className="truncate text-size-xxs text-secondary" title={auth.email}>{auth.email}</p></div>}
              <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="flex size-11 shrink-0 items-center justify-center rounded-surface text-secondary hover:bg-tint"><PortalIcon name="logout" /></button>
            </div>
          )}
          <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={`${collapsed ? 'Expand' : 'Collapse'} sidebar (⌘B / Ctrl+B)`} aria-keyshortcuts="Meta+B Control+B" aria-expanded={!collapsed} className={`flex min-h-11 w-full items-center gap-3 rounded-surface px-3 text-size-xs text-secondary hover:bg-tint ${collapsed ? 'justify-center' : ''}`}><PortalIcon name="panel" className={collapsed ? 'rotate-180' : ''} />{!collapsed && 'Collapse sidebar'}</button>
        </div>
      </aside>}
      <div className="flex min-w-0 flex-1 flex-col bg-raised">
        {auth && <header className="flex h-16 md:hidden shrink-0 items-center justify-between gap-3 border-b border-subtle px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button ref={menuButton} type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen} className="flex size-11 shrink-0 items-center justify-center rounded-surface hover:bg-tint md:hidden"><PortalIcon name="menu" /></button>
          </div>
          {preview && <span className="shrink-0 rounded-full bg-warning-bg px-3 py-1 text-size-xxs text-warning-fg"><span className="hidden sm:inline">Local preview · sample data</span><span className="sm:hidden">Sample data</span></span>}
        </header>}
        <main id="app-content" aria-label={auth ? activeApp?.name : undefined} tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {auth !== null || isLogin ? children : (
            <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
              <span className="mb-6 size-4 rounded-full bg-accent" aria-hidden="true" />
              <H1 className="text-size-xl">BlueDot Apps</H1>
              <p className="mt-3 text-size-sm leading-relaxed text-secondary">Sign in with your BlueDot Google account to continue.</p>
              <CTALinkOrButton url={`/login?redirect_to=${encodeURIComponent(router.asPath)}`} className="mt-7 min-h-11">Continue with Google</CTALinkOrButton>
              {preview && <CTALinkOrButton variant="secondary" className="mt-3 min-h-11" onClick={() => setAuth({ token: PREVIEW_TOKEN, email: PREVIEW_EMAIL, expiresAt: Date.now() + 3_600_000 })}>Explore local preview</CTALinkOrButton>}
            </div>
          )}
        </main>
      </div>
      <Modal desktopHeaderClassName="[&_button]:min-h-11 [&_button]:min-w-11" isOpen={auth !== null && mobileOpen} setIsOpen={(open) => {
        setMobileOpen(open);
        if (!open) menuButton.current?.focus();
      }} title="BlueDot Apps">
        <div className="w-52 max-w-full space-y-5">{navigation(false)}{auth && <><p className="break-all text-size-xs text-secondary">{auth.email}</p><CTALinkOrButton variant="ghost" onClick={signOut}>Sign out</CTALinkOrButton></>}</div>
      </Modal>
      <Modal desktopHeaderClassName="[&_button]:min-h-11 [&_button]:min-w-11" isOpen={auth !== null && leaveAction !== null} setIsOpen={(open) => {
        if (!open) setLeaveAction(null);
      }} title={pendingWrites > 0 ? 'Saving your changes' : 'Leave this review session?'}>
        <div className="max-w-sm space-y-5">
          <p className="text-size-sm leading-relaxed text-secondary">{pendingWrites > 0 ? 'Please wait for your changes to finish saving before leaving.' : 'Saved ratings will be kept. Your place in this session and its timer will reset.'}</p>
          <div className="flex flex-wrap gap-3">
            <CTALinkOrButton variant="secondary" onClick={() => setLeaveAction(null)}>Stay here</CTALinkOrButton>
            <CTALinkOrButton disabled={pendingWrites > 0} onClick={() => {
              const action = leaveAction;
              setLeaveAction(null);
              action?.();
            }}>Leave session</CTALinkOrButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
