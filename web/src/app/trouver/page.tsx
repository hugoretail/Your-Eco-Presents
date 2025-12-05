"use client";

/*
	UX multi‑étapes (wizard) pour trouver une idée de cadeau
*/

import BelowFoldAmbient from '@/components/BelowFoldAmbient';
import DataTransparency from '@/components/DataTransparency';
import { useEffect, useState } from 'react';

const RECIPIENT_OPTIONS = [
	'Mère', 'Père', 'Partenaire/Conjoint(e)', 'Meilleur(e) ami(e)', 'Ami(e)', 'Collègue', 'Enfant', 'Autre'
];
const OCCASION_OPTIONS = [
	'Anniversaire', 'Noël', 'Fête', 'Mariage', 'Naissance', 'Remerciement', 'Autre'
];
const GIFT_TYPE_OPTIONS = [
	'Expérience', 'Objet matériel', 'Les deux', 'Autre'
];
const GIFT_NUMBER_OPTIONS = ['Un seul', 'Plusieurs'];
const CATEGORY_OPTIONS = [
	'Accessoires', 'Arts Visuels', 'Bien-être et détente', 'Bijoux', 'Cinéma et Séries', 'Cuisine Maison', 'Littérature', 'Jeux de société', 'Musique', 'Peinture et Dessin', 'Plantes', 'Poterie et Modelage', 'Spectacles', 'Festivals', 'Sport', 'Vêtements', 'Voyage', 'Autre'
];
const EXCLUDE_OPTIONS = [
	'Produits Alimentaires', 'Livres', 'Cartes cadeaux ou bons d\'achat', 'Objets de déco', 'Bijoux', 'Vêtements', 'Produits Technologiques', 'Autre'
];
const CRITERIA_OPTIONS = [
	'Ethique', 'Eco-Responsable', 'Fabrication locale', 'Originalité', 'Utilité', 'Esthétique', 'Durabilité', 'Prix raisonnable', 'Autre'
];

export default function TrouverPage() {
	const demoMode = process.env.NEXT_PUBLIC_GHPAGES === '1';
	// Etat des champs
	const [recipient, setRecipient] = useState("");
	const [recipientOther, setRecipientOther] = useState("");
	const [occasion, setOccasion] = useState("");
	const [occasionOther, setOccasionOther] = useState("");
	const [age, setAge] = useState("");
	const [giftType, setGiftType] = useState("");
	const [giftTypeOther, setGiftTypeOther] = useState("");
	const [giftNumber, setGiftNumber] = useState("Un seul");
	const [budgetMin, setBudgetMin] = useState("");
	const [budgetMax, setBudgetMax] = useState("");
	const [categories, setCategories] = useState<string[]>([]);
	const [categoriesOther, setCategoriesOther] = useState("");
	const [exclude, setExclude] = useState<string[]>([]);
	const [excludeOther, setExcludeOther] = useState("");
	const [criteria, setCriteria] = useState<string[]>([]);
	const [criteriaOther, setCriteriaOther] = useState("");
	const [interests, setInterests] = useState("");
	const [ideas, setIdeas] = useState("");
	const [info, setInfo] = useState("");
	const [personInfo, setPersonInfo] = useState("");

	// Résultats / parsing
	const [parsedIdeas, setParsedIdeas] = useState<any[] | null>(null);
	const [result, setResult] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [imageModal, setImageModal] = useState<{ product: any; idea: any } | null>(null);
	const [formError, setFormError] = useState("");

	// Wizard
	const [step, setStep] = useState(0);
	const steps = [
		"Contexte",
		"Type & Budget",
		"Affiner",
		"Centres d'intérêt",
		"Finalisation",
	];

	function canProceed(current = step): boolean {
		switch (current) {
			case 0:
				return !!recipient && (!!occasion) && !!age && !(recipient === "Autre" && !recipientOther) && !(occasion === "Autre" && !occasionOther) && !isNaN(Number(age)) && Number(age) >= 0;
			case 1:
				return !!giftType && !(giftType === "Autre" && !giftTypeOther) && !!budgetMin && !!budgetMax && !isNaN(Number(budgetMin)) && !isNaN(Number(budgetMax)) && Number(budgetMin) <= Number(budgetMax);
			case 2:
				return true; // Affinage optionnel
			case 3:
				return true; // Centres d'intérêt / idées préliminaires optionnels
			case 4:
				return true; // libre
			default:
				return false;
		}
	}

	function next() {
		if (!canProceed()) {
			setFormError("Complète les champs requis avant de continuer.");
			return;
		}
		setFormError("");
		setStep(s => Math.min(s + 1, steps.length - 1));
	}
	function prev() {
		setFormError("");
		setStep(s => Math.max(s - 1, 0));
	}

	async function launchGeneration() {
		// Validation globale (reprise stricte des indispensables)
		if (!canProceed(0) || !canProceed(1)) {
			setFormError("Certains champs obligatoires manquent dans les premières étapes.");
			setStep(!canProceed(0) ? 0 : 1);
			return;
		}
		setFormError("");
		setError("");
		setResult("");
		setLoading(true);
		try {
			const res = await fetch("/api/recommend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					recipient: recipient === "Autre" ? recipientOther : recipient,
					occasion: occasion === "Autre" ? occasionOther : occasion,
					age,
						giftType: giftType === "Autre" ? giftTypeOther : giftType,
					giftNumber,
					categories: categories.includes("Autre") && categoriesOther ? [...categories.filter(c => c !== "Autre"), categoriesOther] : categories,
					exclude: exclude.includes("Autre") && excludeOther ? [...exclude.filter(c => c !== "Autre"), excludeOther] : exclude,
					criteria: criteria.includes("Autre") && criteriaOther ? [...criteria.filter(c => c !== "Autre"), criteriaOther] : criteria,
					interests: interests.split(",").map(s => s.trim()).filter(Boolean),
					budgetMin: budgetMin ? Number(budgetMin) : null,
					budgetMax: budgetMax ? Number(budgetMax) : null,
					ideas,
					info,
					personInfo,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Erreur");
			// Le moteur déterministe renvoie { ideas: Product[] }
			const ideasArray: any[] | null = Array.isArray(data.ideas) ? data.ideas : null;
			if (ideasArray) setParsedIdeas(ideasArray);
			else setParsedIdeas(null);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

		// Fermeture via ESC
		useEffect(() => {
			function onKey(e: KeyboardEvent) {
				if (e.key === 'Escape') setImageModal(null);
			}
			if (imageModal) window.addEventListener('keydown', onKey);
			return () => window.removeEventListener('keydown', onKey);
		}, [imageModal]);

		function fmtPrice(prod: any, idea: any) {
			if (prod?.priceCents) return (prod.priceCents / 100).toFixed(2) + '€';
			if (idea?.price || idea?.prix) return (idea.price || idea.prix) + '€';
			return null;
		}

		function linkText(l: { label?: string; url: string }) {
			const lab = (l.label || '').trim();
			if (lab && !/acheter/i.test(lab)) return lab;
			try {
				const u = new URL(l.url);
				const host = u.hostname.replace(/^www\./, '');
				return `Voir sur ${host}`;
			} catch { return 'Voir le site'; }
		}

		function safeParse(json?: string): any[] {
			if (!json) return [];
			try {
				const v = JSON.parse(json);
				return Array.isArray(v) ? v : [];
			} catch { return []; }
		}

		return (
			<div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-10 md:pt-12 space-y-8">
					<div>
				<h1 className="text-3xl font-bold tracking-tight title-gradient">Trouver une idée de cadeau</h1>
				<p className="mt-2 max-w-2xl text-base text-neutral-700">On avance étape par étape. 2 minutes suffisent pour des suggestions vraiment pertinentes.</p>
						<div className="mt-3"><DataTransparency /></div>
			</div>
			<div className="grid gap-8 lg:grid-cols-3">
				{demoMode && (
					<div className="lg:col-span-3 order-1 -mt-2">
						<div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
							Démo statique: les appels IA/API sont désactivés sur GitHub Pages. L’interface est fidèle mais la génération ne fonctionne pas ici.
						</div>
					</div>
				)}
				{/* WIZARD */}
				<div className="order-2 lg:order-1 lg:col-span-1 self-start px-5 py-6 space-y-5 rounded-xl border border-neutral-200 bg-white/95 shadow-lg backdrop-blur">
					<div>
						<div className="flex items-center justify-between mb-2">
							<h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Étape {step + 1}/{steps.length}</h2>
							<span className="text-xs font-medium text-neutral-500">{steps[step]}</span>
						</div>
						<div className="h-2 w-full rounded bg-neutral-200 overflow-hidden">
							<div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
						</div>
					</div>
					<div className="space-y-4 text-neutral-900">
						{step === 0 && (
							<div className="space-y-4">
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">La personne à qui j’offre est :</label>
									<select value={recipient} onChange={e=>setRecipient(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
										<option value="" disabled>Sélectionner…</option>
										{RECIPIENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
									</select>
									{recipient === 'Autre' && (
										<input value={recipientOther} onChange={e=>setRecipientOther(e.target.value)} placeholder="Préciser…" className="w-full mt-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
									)}
								</div>
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Quelle occasion ?</label>
									<select value={occasion} onChange={e=>setOccasion(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
										<option value="" disabled>Sélectionner…</option>
										{OCCASION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
									</select>
									{occasion === 'Autre' && (
										<input value={occasionOther} onChange={e=>setOccasionOther(e.target.value)} placeholder="Préciser…" className="w-full mt-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
									)}
								</div>
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Âge (approx.)</label>
									<input type="number" min="0" max="120" value={age} onChange={e=>setAge(e.target.value)} placeholder="Ex: 30" className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
								</div>
								<p className="text-xs text-neutral-500">Ces 3 premières infos nous permettent de cadrer le ton & la tranche d’idées.</p>
								<p className="text-xs text-neutral-500">On évite de te reproposer ce que tu as déjà en tête.</p>
								<p className="text-xs text-neutral-500">Tu peux laisser vide si tu n’as rien de plus. Lance la recherche pour voir les idées.</p>
							</div>
						)}
						{step === 1 && (
							<div className="space-y-4">
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Type de cadeau</label>
									<select value={giftType} onChange={e=>setGiftType(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
										<option value="" disabled>Sélectionner…</option>
										{GIFT_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
									</select>
									{giftType === 'Autre' && (
										<input value={giftTypeOther} onChange={e=>setGiftTypeOther(e.target.value)} placeholder="Préciser…" className="w-full mt-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
									)}
								</div>
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Nombre de cadeaux</label>
									<div className="flex gap-4">
										{GIFT_NUMBER_OPTIONS.map(opt => (
											<label key={opt} className="inline-flex items-center gap-2 text-sm">
												<input type="radio" name="giftNumber" value={opt} checked={giftNumber===opt} onChange={e=>setGiftNumber(e.target.value)} /> {opt}
											</label>
										))}
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<label className="block text-sm font-bold mb-1">Budget min (€)</label>
										<input type="number" value={budgetMin} onChange={e=>setBudgetMin(e.target.value)} placeholder="Min" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
									</div>
									<div className="space-y-1">
										<label className="block text-sm font-bold mb-1">Budget max (€)</label>
										<input type="number" value={budgetMax} onChange={e=>setBudgetMax(e.target.value)} placeholder="Max" className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
									</div>
								</div>
								<p className="text-xs text-neutral-500">On affinera après. Un ordre de grandeur suffit.</p>
							</div>
						)}
						{step === 2 && (
							<div className="space-y-5">
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Catégories préférées (max 5)</label>
									<div className="grid grid-cols-2 gap-2">
										{CATEGORY_OPTIONS.map(opt => (
											<label key={opt} className="inline-flex items-center gap-2 text-xs">
												<input type="checkbox" value={opt} checked={categories.includes(opt)} disabled={categories.length>=5 && !categories.includes(opt)} onChange={e=>{ if(e.target.checked) setCategories([...categories,opt]); else setCategories(categories.filter(c=>c!==opt)); }} /> {opt}
											</label>
										))}
									</div>
									{categories.includes('Autre') && (
										<input value={categoriesOther} onChange={e=>setCategoriesOther(e.target.value)} placeholder="Préciser…" className="w-full mt-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
									)}
								</div>
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Catégories à exclure</label>
									<div className="grid grid-cols-2 gap-2">
										{EXCLUDE_OPTIONS.map(opt => (
											<label key={opt} className="inline-flex items-center gap-2 text-xs">
												<input type="checkbox" value={opt} checked={exclude.includes(opt)} onChange={e=>{ if(e.target.checked) setExclude([...exclude,opt]); else setExclude(exclude.filter(c=>c!==opt)); }} /> {opt}
											</label>
										))}
									</div>
									{exclude.includes('Autre') && (
										<input value={excludeOther} onChange={e=>setExcludeOther(e.target.value)} placeholder="Préciser…" className="w-full mt-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
									)}
								</div>
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Critères importants</label>
									<div className="grid grid-cols-2 gap-2">
										{CRITERIA_OPTIONS.map(opt => (
											<label key={opt} className="inline-flex items-center gap-2 text-xs">
												<input type="checkbox" value={opt} checked={criteria.includes(opt)} onChange={e=>{ if(e.target.checked) setCriteria([...criteria,opt]); else setCriteria(criteria.filter(c=>c!==opt)); }} /> {opt}
											</label>
										))}
									</div>
									{criteria.includes('Autre') && (
										<input value={criteriaOther} onChange={e=>setCriteriaOther(e.target.value)} placeholder="Préciser…" className="w-full mt-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
									)}
								</div>
								<p className="text-xs text-neutral-500">Optionnel. Utilise-les si tu veux orienter ou filtrer.</p>
							</div>
						)}
						{step === 3 && (
							<div className="space-y-4">
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Centres d’intérêt (séparés par des virgules)</label>
									<input value={interests} onChange={e=>setInterests(e.target.value)} placeholder="Ex: vélo, café, nature" className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
								</div>
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Déjà envisagé ?</label>
									<input value={ideas} onChange={e=>setIdeas(e.target.value)} placeholder="Ex: livre, expérience, etc." className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
								</div>
								<p className="text-xs text-neutral-500">On évite de te reproposer ce que tu as déjà en tête.</p>
							</div>
						)}
						{step === 4 && (
							<div className="space-y-5">
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Autres informations utiles</label>
									<textarea value={info} onChange={e=>setInfo(e.target.value)} rows={2} placeholder="Contexte, passions, atmosphère recherchée…" className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
								</div>
								<div className="space-y-1">
									<label className="block text-sm font-bold mb-1">Infos sur la personne (cadeaux précédents…)</label>
									<textarea value={personInfo} onChange={e=>setPersonInfo(e.target.value)} rows={2} placeholder="Cadeaux passés, anecdotes, contraintes…" className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" />
								</div>
								<p className="text-xs text-neutral-500">Tu peux laisser vide si tu n’as rien de plus. Lance la recherche pour voir les idées.</p>
							</div>
						)}
					</div>
					<div className="pt-1 flex flex-col gap-2">
						{formError && <p className="text-sm font-medium text-red-600 bg-red-50 border-l-4 border-red-400 px-2 py-1 rounded">{formError}</p>}
						{error && <p className="text-sm font-medium text-red-600 bg-red-50 border-l-4 border-red-400 px-2 py-1 rounded">{error}</p>}
						<div className="flex items-center gap-2">
							{step > 0 && (
								<button onClick={prev} className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition" type="button">Retour</button>
							)}
							{step < steps.length - 1 && (
								<button onClick={next} disabled={!canProceed()} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition" type="button">Suivant</button>
							)}
							{step === steps.length - 1 && (
								<button onClick={launchGeneration} disabled={loading || demoMode} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition" type="button">
									{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent"/>}
									{demoMode ? 'Désactivé sur la démo' : (loading ? 'Recherche…' : 'Lancer la recherche')}
								</button>
							)}
						</div>
						{!error && !loading && parsedIdeas && <p className="text-xs text-neutral-500">{parsedIdeas.length} idée(s) structurées.</p>}
					</div>
				</div>
				{/* RESULTATS */}
				<div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
					<h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Résultats</h2>
					{loading && (
						<div className="card animate-pulse">
							<div className="h-4 w-24 rounded bg-neutral-200" />
							<div className="mt-4 space-y-2">
								<div className="h-3 w-full rounded bg-neutral-200" />
								<div className="h-3 w-5/6 rounded bg-neutral-200" />
								<div className="h-3 w-4/6 rounded bg-neutral-200" />
							</div>
						</div>
					)}
					{!loading && parsedIdeas && parsedIdeas.length > 0 && (
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{parsedIdeas.map((idea: any, idx: number) => {
								const prod = idea.__product;
								const imgSrc = prod?.image || "/logo.png";
								return (
									<div key={idx} className="card group relative overflow-hidden border-emerald-100 hover:shadow-md transition-shadow">
										<div className="aspect-video w-full overflow-hidden rounded-md bg-neutral-100 mb-3 cursor-pointer" onClick={() => setImageModal({ product: prod, idea })}>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={imgSrc} alt={prod?.name || idea.title || idea.nom || "Produit"} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
										</div>
										<div className="flex items-start justify-between gap-3">
											<h3 className="text-base font-semibold leading-snug tracking-tight text-emerald-800">{idea.title || idea.nom || `Idée ${idx + 1}`}</h3>
											{prod?.priceCents ? (
												<span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">{(prod.priceCents / 100).toFixed(0)}€</span>
											) : idea.price || idea.prix ? (
												<span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">{idea.price || idea.prix}€</span>
											) : null}
										</div>
										{idea.description && <p className="mt-2 text-xs leading-relaxed text-neutral-600">{idea.description}</p>}
										<div className="mt-3 flex flex-wrap gap-1">
											{(idea.labels || idea.tags || prod?.labels ? JSON.parse(prod?.labels || "[]") : [])
												.slice(0, 6)
												.map((t: string, i: number) => (
													<span key={i} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-neutral-600">{t}</span>
												))}
										</div>
										{prod?.purchaseLinks && (() => {
											let links: Array<{label:string, url:string}> = [];
											try { links = JSON.parse(prod.purchaseLinks) || []; } catch {}
											if (!Array.isArray(links) || links.length === 0) return null;
											return (
												<div className="mt-3 flex flex-wrap gap-2">
													{links.slice(0,3).map((l, i) => (
														<a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100">
															{l.label || 'Acheter'}
														</a>
													))}
												</div>
											);
										})()}
									</div>
								);
							})}
						</div>
					)}
					{imageModal && (() => {
						const prod = imageModal.product || {};
						const idea = imageModal.idea || {};
						const labels = safeParse(prod.labels).slice(0, 20);
						const categories = safeParse(prod.categories).slice(0, 12);
						let links: Array<{label:string, url:string}> = [];
						try { links = safeParse(prod.purchaseLinks); } catch {}
						return (
							<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
								<div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-sm" onClick={() => setImageModal(null)} />
								<div className="relative w-full max-w-4xl rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
									<button onClick={() => setImageModal(null)} className="absolute top-2 right-2 rounded-full bg-neutral-900/80 text-white px-2 py-1 text-xs font-semibold shadow hover:bg-neutral-800">Fermer</button>
									<div className="grid md:grid-cols-2 gap-0">
										<div className="relative bg-neutral-50 md:border-r md:border-neutral-200">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={prod.image || '/logo.png'} alt={prod.name || idea.title || 'Produit'} className="w-full h-full object-contain max-h-[60vh] p-4" />
											{prod.brand && <span className="absolute bottom-3 left-3 rounded bg-white/80 px-2 py-1 text-[11px] font-semibold text-neutral-700 shadow">{prod.brand}</span>}
										</div>
										<div className="p-5 space-y-4">
											<div>
												<h3 className="text-xl font-bold tracking-tight text-emerald-700">{prod.name || idea.title || idea.nom || 'Idée cadeau'}</h3>
												{idea.description || prod.description ? (
													<p className="mt-1 text-sm leading-relaxed text-neutral-700">{idea.description || prod.description}</p>
												) : null}
											</div>
											<div className="flex flex-wrap gap-2 items-center">
												{fmtPrice(prod, idea) && <span className="rounded-md bg-emerald-600/10 px-2 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">{fmtPrice(prod, idea)}</span>}
												{prod.origin && <span className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600">Origine: {prod.origin}</span>}
											</div>
											{labels.length > 0 && (
												<div>
													<p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Labels repérés</p>
													<div className="mt-1 flex flex-wrap gap-2">
														{labels.map((label:string, index:number) => (
															<span key={`${label}-${index}`} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{label}</span>
														))}
													</div>
												</div>
											)}
											{categories.length > 0 && (
												<div>
													<p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Catégories associées</p>
													<div className="mt-1 flex flex-wrap gap-2">
														{categories.map((category:string, index:number) => (
															<span key={`${category}-${index}`} className="rounded-full bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{category}</span>
														))}
													</div>
												</div>
											)}
											{links.length > 0 && (
												<div className="flex flex-wrap gap-3">
													{links.slice(0,5).map((l,i) => (
														<a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline underline-offset-2 font-semibold hover:text-emerald-600">
															{linkText(l)}
														</a>
													))}
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						);
					})()}
					{!loading && !parsedIdeas && result && (
						<div className="card whitespace-pre-wrap text-sm leading-relaxed">{result}</div>
					)}
					{!loading && !result && (!parsedIdeas || parsedIdeas.length === 0) && <p className="text-sm text-neutral-500">Aucune idée pour l’instant. Complète le mini questionnaire puis lance la recherche.</p>}
				</div>
			</div>
				<BelowFoldAmbient />
			</div>
	);
}
