"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Consent = { necessary: true; functional: boolean; analytics: boolean };
type ConsentContextType = {
  consent: Consent | null;
  setConsent: (c: Consent) => void;
  ready: boolean;
};

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax${secure}`;
}

const COOKIE_NAME = "consent.v1";

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = readCookie(COOKIE_NAME);
      if (raw) {
        const parsed = JSON.parse(raw) as Consent;
        // Always enforce necessary true
        parsed.necessary = true;
        setConsentState(parsed);
      }
    } catch {}
    setReady(true);
  }, []);

  const setConsent = (c: Consent) => {
    const normalized: Consent = { necessary: true, functional: !!c.functional, analytics: !!c.analytics };
    setConsentState(normalized);
    try { writeCookie(COOKIE_NAME, JSON.stringify(normalized)); } catch {}
  };

  const value = useMemo<ConsentContextType>(() => ({ consent, setConsent, ready }), [consent, ready]);
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}

export function CookieBanner() {
  const { consent, setConsent, ready } = useConsent();
  const [openPrefs, setOpenPrefs] = useState(false);
  const [prefsFunctional, setPrefsFunctional] = useState(true);
  const [prefsAnalytics, setPrefsAnalytics] = useState(false);

  useEffect(() => {
    if (consent) {
      setPrefsFunctional(!!consent.functional);
      setPrefsAnalytics(!!consent.analytics);
    }
  }, [consent]);

  if (!ready) return null;
  // If consent already given, hide
  if (consent) return null;

  const acceptAll = () => setConsent({ necessary: true, functional: true, analytics: true });
  const rejectAll = () => setConsent({ necessary: true, functional: false, analytics: false });
  const savePrefs = () => setConsent({ necessary: true, functional: prefsFunctional, analytics: prefsAnalytics });

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-4">
      <div className="w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="text-[13px] md:text-sm text-neutral-900 md:flex-1 leading-relaxed">
            Nous utilisons des cookies et un stockage local pour:
            <ul className="list-disc pl-5 mt-1">
              <li>Essentiels: assurer le fonctionnement du site</li>
              <li>Fonctionnels: mémoriser vos préférences d’animation</li>
              <li>Mesure d’audience (optionnel): améliorer notre produit</li>
            </ul>
          </div>
          <div className="flex gap-2 md:justify-end">
            <button onClick={() => setOpenPrefs(true)} className="rounded-full border border-neutral-400 px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400">Personnaliser</button>
            <button onClick={rejectAll} className="rounded-full border border-neutral-400 px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400">Tout refuser</button>
            <button onClick={acceptAll} className="rounded-full bg-green-700 hover:bg-green-600 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">Tout accepter</button>
          </div>
        </div>
        {openPrefs && (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3" role="dialog" aria-label="Préférences de cookies">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-neutral-900">Essentiels</div>
                <div className="text-[12px] text-neutral-700">Toujours actifs — sécurité, session, fonctionnement.</div>
              </div>
              <div className="text-[12px] font-medium text-neutral-700">Obligatoires</div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-neutral-900">Fonctionnels</div>
                <div className="text-[12px] text-neutral-700">Mémoriser vos préférences d’animation.</div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-neutral-900">
                <input type="checkbox" checked={prefsFunctional} onChange={(e)=>setPrefsFunctional(e.target.checked)} />
                <span>Activer</span>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-neutral-900">Mesure d’audience</div>
                <div className="text-[12px] text-neutral-700">Statistiques anonymisées pour améliorer le site.</div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-neutral-900">
                <input type="checkbox" checked={prefsAnalytics} onChange={(e)=>setPrefsAnalytics(e.target.checked)} />
                <span>Activer</span>
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={()=>{ setPrefsFunctional(false); setPrefsAnalytics(false); savePrefs(); setOpenPrefs(false); }} className="rounded-full border border-neutral-400 px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400">Tout refuser</button>
              <button onClick={()=>{ savePrefs(); setOpenPrefs(false); }} className="rounded-full bg-neutral-900 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600">Enregistrer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
