"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavLink { href: string; label: string; adminOnly?: boolean }
const baseLinks: NavLink[] = [
  { href: '/', label: 'Accueil' },
  { href: '/trouver', label: 'Trouver un cadeau' },
  { href: '/blog', label: 'Blog' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // Fetch user util
  function loadUser() {
    fetch('/api/auth/me')
      .then(r=>r.json())
      .then(j=>{ if (j.authenticated) setUser(j.user); else setUser(null); })
      .catch(()=> setUser(null));
  }

  // Initial + route change
  useEffect(() => { loadUser(); }, [pathname]);

  // Custom event après login/logout
  useEffect(() => {
    function handler() { loadUser(); }
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }, []);

  // Fermer le menu utilisateur au clic en dehors
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [menuOpen]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.dispatchEvent(new Event('auth-changed'));
    router.push('/login');
  }

  // Variants framer
  const panelVariants = {
    hidden: { x: '100%' },
    visible: { x: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 28 } },
    exit: { x: '100%', transition: { duration: 0.25 } }
  };

  const linkBase = 'relative px-3 py-2 rounded-full text-sm font-medium transition hover:opacity-90';

  return (
  <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 py-3 text-sm">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="Logo Eco-Presents" width={48} height={48} className="w-12 h-12 drop-shadow-sm group-hover:scale-105 transition" />
          <span className="text-lg font-extrabold tracking-tight text-green-800">
            Eco‑Presents
          </span>
        </Link>
  <ul className="hidden md:flex items-center gap-1">
          {baseLinks.filter(l=> !l.adminOnly || (l.adminOnly && user?.role==='ADMIN')).map(l => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link href={l.href} className={`${linkBase} ${active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'text-neutral-700 hover:bg-neutral-100'}`}>{l.label}</Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="hidden md:flex items-center gap-3">
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              onMouseEnter={() => setMenuOpen(true)}
              className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 shadow-sm ring-1 ring-neutral-200"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menu du compte"
            >
              {/* Icône utilisateur */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-600 group-hover:text-neutral-800">
                <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M4 20.5a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  onMouseLeave={() => setMenuOpen(false)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2 w-56 z-50 rounded-xl border border-neutral-200 bg-white shadow-lg p-2"
                  role="menu"
                >
                  <Link href="/compte" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100" role="menuitem" onClick={() => setMenuOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="1.6"/><path d="M4 20.5a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                    Mon compte
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100" role="menuitem" onClick={() => setMenuOpen(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50" role="menuitem">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 12H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M11 8l-4 4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                    Déconnexion
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <a href="/login" className="rounded-full bg-green-600 hover:bg-green-500 px-5 py-2 text-white font-semibold shadow hover:shadow-md transition">Connexion</a>
        )}
        <button onClick={()=>setOpen(o=>!o)} className="md:hidden" aria-label="Menu" />
      </div>
      {/* Burger mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-neutral-900/90 text-white px-4 py-2 shadow active:scale-95">
        <span className="relative w-4 h-4">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-white rounded" />
          <span className="absolute inset-x-0 top-1/2 -mt-0.5 h-0.5 bg-white rounded" />
          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white rounded" />
        </span>
        Menu
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={()=>setOpen(false)}
            />
            <motion.aside
              key="panel"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 right-0 z-50 h-full w-[78%] max-w-sm bg-white shadow-xl flex flex-col p-6 gap-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Eco-Presents" width={44} height={44} className="w-11 h-11" />
                  <span className="font-bold text-lg text-green-800">Eco‑Presents</span>
                </div>
                <button onClick={()=>setOpen(false)} aria-label="Fermer" className="rounded-full bg-neutral-100 p-2 hover:bg-neutral-200 active:scale-95">✕</button>
              </div>
              <nav>
                <ul className="space-y-2">
                  {baseLinks.filter(l=> !l.adminOnly || (l.adminOnly && user?.role==='ADMIN')).map(l => {
                    const active = pathname === l.href;
                    return (
                      <li key={l.href}>
                          <Link onClick={()=>setOpen(false)} href={l.href} className={`block rounded-lg px-4 py-3 text-base font-semibold ${active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800'}`}>{l.label}</Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link onClick={()=>setOpen(false)} href="/partenaires" className="block rounded-lg px-4 py-3 text-base font-semibold bg-neutral-50 hover:bg-neutral-100 text-neutral-800">Devenir partenaire</Link>
                  </li>
                </ul>
              </nav>
              <div className="mt-auto space-y-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {user.email} {user.role==='ADMIN' && <span className="text-emerald-600 font-semibold">(admin)</span>}
                    </div>
                    {user.role==='ADMIN' && (
                      <Link onClick={()=>setOpen(false)} href="/admin" className="block w-full text-center rounded-full bg-emerald-50 text-emerald-700 px-5 py-3 text-sm font-semibold shadow-sm hover:bg-emerald-100 border border-emerald-200">Admin</Link>
                    )}
                    <Link onClick={()=>setOpen(false)} href="/compte" className="block w-full text-center rounded-full bg-neutral-900 text-white px-5 py-3 text-sm font-semibold shadow hover:bg-neutral-800">Mon compte</Link>
                    <button onClick={handleLogout} className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-red-500">Déconnexion</button>
                  </div>
                ) : (
                  <a href="/login" onClick={()=>setOpen(false)} className="block w-full text-center rounded-full bg-green-600 hover:bg-green-500 px-6 py-3 text-sm font-semibold text-white shadow hover:shadow-md">Connexion</a>
                )}
                <p className="text-[11px] text-neutral-400">Offrir. Partager. Sourire.</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
