"use client";
import Image from "next/image";

export default function EquipePage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-emerald-800 mb-6">Notre Équipe</h1>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Image src="/team/placeholder.jpg" alt="Hugo" width={80} height={80} className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400" />
          <div>
            <h2 className="text-xl font-semibold text-neutral-800">Hugo Retail</h2>
            <p className="text-neutral-600">Développeur</p>
          </div>
        </div>
        {/* Ajouter d'autres membres ici */}
        <div className="flex items-center gap-4">
          <Image src="/team/placeholder.jpg" alt="Marin" width={80} height={80} className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400" />
          <div>
            <h2 className="text-xl font-semibold text-neutral-800">Marin</h2>
            <p className="text-neutral-600">Fondateur</p>
          </div>
        </div>
        {/* ... */}
      </div>
    </div>
  );
}
