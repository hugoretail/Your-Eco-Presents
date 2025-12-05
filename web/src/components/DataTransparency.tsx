"use client";
import Link from 'next/link';

export default function DataTransparency({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-[12px] text-emerald-900 ${className}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-emerald-600" aria-hidden />
        <div>
          <p className="font-semibold">Transparence & confidentialité</p>
          <p className="mt-0.5 leading-relaxed">
            Nous ne revendons ni ne réutilisons vos données. Les informations saisies sont chiffrées en transit et uniquement utilisées pour générer vos idées.
            Consultez notre <Link href="/legal/confidentialite" className="font-semibold underline underline-offset-2">page de confidentialité</Link> pour les détails.
          </p>
        </div>
      </div>
    </div>
  );
}
