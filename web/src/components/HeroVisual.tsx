"use client";
import { motion } from "framer-motion";

interface GiftCardProps { label: string; delay?: number; x?: number; y?: number; }

function FloatingGift({ label, delay=0, x=0, y=0 }: GiftCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: .6, x, y }}
      animate={{ opacity: 1, scale: 1, x, y }}
      transition={{ duration: .8, delay }}
      className="absolute select-none"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <div className="rounded-2xl bg-white/80 backdrop-blur shadow-lg px-4 py-3 text-xs font-semibold text-neutral-700 ring-1 ring-white/60 hover:-rotate-3 transition will-change-transform">
        {label}
      </div>
    </motion.div>
  );
}

export default function HeroVisual() {
  return (
    <div className="absolute inset-0 z-30">
      {/* Effet étoiles filantes retiré */}
      {/* Étiquettes flottantes conservées */}
      <FloatingGift label="Créatif" delay={.6} x={-20} y={30} />
      <FloatingGift label="Personnalisé" delay={.9} x={110} y={-5} />
    </div>
  );
}
