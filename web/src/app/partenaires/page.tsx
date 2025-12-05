"use client";
import { motion } from "framer-motion";

export default function PartenairesPage() {
  return (
    <motion.div
      className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-12"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <h1 className="text-3xl font-bold text-emerald-800 mb-6">Comment devenir partenaire ?</h1>
      <p className="text-lg text-neutral-700 mb-6">Vous souhaitez proposer vos produits ou services sur Green‑K‑Do ? Rejoignez notre réseau de partenaires et touchez une audience en quête de cadeaux originaux et personnalisés.</p>
      <ul className="list-disc pl-6 mb-6 text-neutral-600">
        <li>Remplissez le formulaire de contact ci-dessous</li>
        <li>Nous étudions votre proposition et revenons vers vous rapidement</li>
        <li>Partenariat flexible, visibilité, et valeurs partagées</li>
      </ul>
      <form className="space-y-4 bg-white rounded-xl shadow p-6 border">
        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1">Nom de la marque / entreprise</label>
          <input type="text" className="w-full rounded-lg border border-neutral-300 px-4 py-2" placeholder="Votre nom" />
        </div>
        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1">Email de contact</label>
          <input type="email" className="w-full rounded-lg border border-neutral-300 px-4 py-2" placeholder="Votre email" />
        </div>
        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1">Message / proposition</label>
          <textarea className="w-full rounded-lg border border-neutral-300 px-4 py-2" rows={3} placeholder="Décrivez votre offre, vos valeurs, etc." />
        </div>
        <button type="submit" className="rounded-full bg-emerald-600 px-6 py-2 text-white font-bold shadow hover:bg-emerald-500 transition">Envoyer</button>
      </form>
    </motion.div>
  );
}
