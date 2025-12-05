

"use client";
import DataTransparency from "@/components/DataTransparency";
import DiagonalAmbient from "@/components/DiagonalAmbient";
import HeroVisual from "@/components/HeroVisual";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function HomePage() {
  const videos = ['/media/video1.av1.mp4', '/media/video2.av1.mp4'];
  const [videoIndex, setVideoIndex] = useState(0); // start with video1
  const frontRef = useRef<HTMLVideoElement | null>(null);
  const backRef = useRef<HTMLVideoElement | null>(null);
  const [isFrontActive, setIsFrontActive] = useState(true);

  function handleEnded() {
    setVideoIndex((i) => (i + 1) % videos.length);
  }

  useEffect(() => {
    // Cross-fade between two stacked videos to avoid gaps on source switch
    const active = isFrontActive ? frontRef.current : backRef.current;
    const standby = isFrontActive ? backRef.current : frontRef.current;
    if (!active || !standby) return;
    // Load next source in standby element
    standby.src = videos[videoIndex];
    standby.load();
    standby.muted = true;
    standby.playsInline = true;
    // Pre-play hidden video, then fade
    const start = async () => {
      try { standby.currentTime = 0; } catch {}
      try { await standby.play(); } catch {}
      // Fade: bring standby to front
      active.style.transition = 'opacity 600ms ease';
      standby.style.transition = 'opacity 600ms ease';
      active.style.opacity = '0';
      standby.style.opacity = '1';
      // Swap roles after fade completes
      setTimeout(() => setIsFrontActive(prev => !prev), 650);
    };
    start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoIndex]);

  return (
  <div className="relative">
      {/* HERO */}
  <section id="hero" className="relative overflow-hidden w-full py-24 md:py-28 min-h-[70vh] md:min-h-[85vh] full-bleed">
        {/* Fond vidéo/GIF onirique + overlay lisible */}
        <div className="absolute inset-0 bg-[url('/team/placeholder.jpg')] bg-cover bg-center" aria-hidden />
        {/* Double video stack for seamless cross-fade */}
        <video
          ref={frontRef}
          className="absolute inset-0 h-full w-full object-cover z-0"
          style={{ opacity: isFrontActive ? 1 : 0 }}
          autoPlay
          muted
          playsInline
          poster="/team/placeholder.jpg"
          aria-hidden
          onEnded={handleEnded}
          src={videos[0]}
        />
        <video
          ref={backRef}
          className="absolute inset-0 h-full w-full object-cover z-0"
          style={{ opacity: isFrontActive ? 0 : 1 }}
          autoPlay
          muted
          playsInline
          poster="/team/placeholder.jpg"
          aria-hidden
          onEnded={handleEnded}
        />
    <div className="absolute inset-0 bg-black/60 z-10" aria-hidden />
    <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay noise z-20" />
  <div className="relative z-30 mx-auto w-full max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.8}}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/40 backdrop-blur px-4 py-1 text-xs font-semibold tracking-wide text-neutral-800 shadow ring-1 ring-white/50">Offrir crée du lien</span>
            </motion.div>
            <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1,duration:.9}} className="text-5xl md:text-6xl font-extrabold leading-tight text-white drop-shadow">
              Des idées de cadeaux<br className="hidden sm:block" /> qui touchent droit au cœur
            </motion.h1>
            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.9}} className="text-lg md:text-xl text-neutral-100/90 font-medium max-w-xl">
              Personnalise quelques infos, reçois instantanément des suggestions originales, émotionnelles et adaptées à la personne. Tout ce qu’il faut pour déclencher un vrai sourire.
            </motion.p>
            <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:.35}} className="flex flex-col sm:flex-row gap-4">
              <motion.a whileHover={{scale:1.05}} whileTap={{scale:.96}} href="/trouver" className="rounded-full bg-green-600 text-white px-8 py-4 font-semibold text-lg shadow-lg hover:bg-green-500">Commencer</motion.a>
              <motion.a whileHover={{scale:1.05}} whileTap={{scale:.96}} href="#comment-ca-marche" className="rounded-full bg-white/10 backdrop-blur px-8 py-4 font-semibold text-white ring-1 ring-white/40 hover:bg-white/15">Comment ça marche</motion.a>
            </motion.div>
          </div>
          <div className="relative h-[360px] md:h-[480px]">
            <HeroVisual />
          </div>
        </div>
      </section>

  {/* HOW IT WORKS */}
  <section id="comment-ca-marche" className="relative z-10 mx-auto w-full max-w-6xl py-16 px-4 sm:px-6 space-y-10 flex flex-col items-center">
  <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-neutral-900 mb-6">Comment ça marche ?</motion.h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[{
            title:'1. Tu racontes',
            text:'Sélectionne le lien (ami, parent…) + quelques traits, passions & contraintes.'
          },{
            title:'2. On imagine',
            text:'On transforme ces indices en pistes cadeau riches & variées.'
          },{
            title:'3. Tu crées le souvenir',
            text:'Tu choisis, personnalises et passes à l’action. Souvenir créé.'
          }].map((b,i)=>(
            <motion.div key={i} initial={{opacity:0,y:25}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.4}} transition={{delay:i*0.1}} className="glass rounded-2xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute -top-6 -right-4 text-7xl opacity-10 select-none font-black">{i+1}</div>
              <h3 className="text-xl font-bold mb-3 text-neutral-900 text-center">{b.title}</h3>
              <p className="text-sm text-neutral-700 leading-relaxed text-center">{b.text}</p>
            </motion.div>
          ))}
        </div>
        <div className="w-full max-w-3xl mx-auto"><DataTransparency /></div>
      </section>

      {/* Diagonal ambient between sections (background, no layout impact) */}
  <DiagonalAmbient />

      {/* FEATURES / EMOTION */}
  <section id="pourquoi" className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16 space-y-10 flex flex-col items-center">
  <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-neutral-900 mb-6">Pourquoi ça fait la différence ?</motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Remplacement des emojis par des icônes Heroicons ou SVG stylisés */}
          {[
            {icon: <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#a7f3d0"/><path d="M10 18c0-2.5 2-4.5 4.5-4.5S19 15.5 19 18" stroke="#065f46" strokeWidth="2" strokeLinecap="round"/></svg>, title:'Créativité guidée', text:'Des idées inattendues mais cohérentes avec la personnalité.'},
            {icon: <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#bbf7d0"/><path d="M10 16h12M16 10v12" stroke="#065f46" strokeWidth="2" strokeLinecap="round"/></svg>, title:'Contextualisation', text:'Chaque piste explique le “pourquoi elle” pour renforcer l’intention.'},
            {icon: <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#a7f3d0"/><path d="M16 10v12M10 16h12" stroke="#065f46" strokeWidth="2" strokeLinecap="round"/></svg>, title:'Rapide', text:'Quelques secondes suffisent à débloquer ton inspiration.'},
            {icon: <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#86efac"/><path d="M16 10l6 12H10l6-12z" fill="#065f46"/></svg>, title:'Pertinence émotionnelle', text:'On cible souvenir, utilité, surprise selon ce que tu privilégies.'},
            {icon: <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#bbf7d0"/><path d="M10 22V10h12v12H10z" stroke="#065f46" strokeWidth="2"/></svg>, title:'Personnalisable', text:'Tu ajustes critères, budget, exclusions sans te perdre.'}
          ].map((f,i)=>(
            <motion.div key={i} initial={{opacity:0,scale:.9}} whileInView={{opacity:1,scale:1}} viewport={{once:true,amount:.4}} transition={{delay:i*0.06}} className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow hover:shadow-md transition relative flex flex-col items-center w-full max-w-xs mx-auto">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-bold mb-2 text-lg text-neutral-900 text-center">{f.title}</h3>
              <p className="text-sm text-neutral-700 leading-relaxed text-center">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
  <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-28">
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="rounded-3xl bg-neutral-900 text-white p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,.12),transparent_60%)]" />
          <div className="relative space-y-6 max-w-xl">
            <h2 className="text-3xl md:text-4xl font-extrabold leading-snug">Prêt à faire vibrer quelqu’un ?</h2>
            <p className="text-base md:text-lg text-neutral-200">Lance une recherche maintenant et choisis l’idée qui résonne vraiment. Chaque cadeau devient une histoire.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/trouver" className="rounded-full bg-green-600 px-8 py-4 font-semibold shadow-lg hover:bg-green-500 text-white">Commencer</a>
              <a href="#comment-ca-marche" className="rounded-full bg-white/10 ring-1 ring-white/30 px-8 py-4 font-semibold text-white hover:bg-white/15">Voir le processus</a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
