"use client";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full mt-12 border-t border-neutral-200 bg-neutral-100/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 drop-shadow" />
            <span className="font-semibold tracking-tight text-green-800">Eco‑Presents</span>
          </div>
          <p className="text-neutral-600 leading-relaxed max-w-xs">Des idées de cadeaux qui créent un vrai souvenir. Personnalisé, émotionnel, et utile.</p>
          <p className="text-[11px] text-neutral-500">© {year} Tous droits réservés.</p>
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-700">Produit</h3>
          <ul className="space-y-1 text-neutral-600">
            <li><Link href="/trouver" className="hover:text-emerald-600 transition">Trouver un cadeau</Link></li>
            <li><Link href="/blog" className="hover:text-emerald-600 transition">Blog</Link></li>
            <li><Link href="/partenaires" className="hover:text-emerald-600 transition">Partenaires</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-700">Légal</h3>
          <ul className="space-y-1 text-neutral-600">
            <li><Link href="/legal/mentions" className="hover:text-emerald-600 transition">Mentions légales</Link></li>
            <li><Link href="/legal/confidentialite" className="hover:text-emerald-600 transition">Confidentialité</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-700">Réseaux</h3>
          <ul className="space-y-1 text-neutral-600">
            <li><a href="#" className="hover:text-emerald-600 transition">Instagram</a></li>
            <li><a href="#" className="hover:text-emerald-600 transition">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <div className="px-4 pb-6 text-center sm:text-left max-w-6xl mx-auto">
        <p className="text-[11px] text-neutral-500">Construit avec ❤️ et un soupçon d&rsquo;imagination.</p>
      </div>
    </footer>
  );
}
