# Eco-Presents

## Orientation IA (moyen terme)

- Moyen terme = 2–6 mois: consolider les briques déterministes (ANN, filtres/règles, reranker) et réduire latence/coûts; possibilité de modèle open-source auto‑hébergé si volume stable.

Local vs cloud: possible d’héberger un modèle open-source local (ex: Llama 3.x 8B) pour réduire coûts récurrents et mieux contrôler la donnée; conso énergétique dépendra du matériel et de la charge. Tant que le trafic est faible, un LLM hébergé localement sur GPU/CPU peut être sobre et économique si bien dimensionné.

## Données: où les trouver et comment structurer

Objectif initial: petit catalogue FR (Nouvelle-Aquitaine / France) d’entreprises éco‑responsables, 50–300 produits correctement étiquetés.

Sources potentielles (priorité FR, zéro budget):

- Sites de labels et annuaires officiels:
  - ADEME (répertoires, guides, fiches produits/éco‑labels)
  - EU Ecolabel (liste de produits/services certifiés)
  - Labels: Fairtrade/Commerce Équitable, GOTS, FSC/PEFC, B‑Corp (au niveau entreprise), Cosmébio/Ecocert, etc.
- Annuaire d’entreprises locales et circuits courts:
  - Chambres de commerce, plateformes régionales, annuaires bio/vrac, marketplaces locales (vérifier conditions d’usage des données)
- Boutiques éco‑responsables (description produits, catégories, prix) avec conditions d’utilisation permettant la référence (et lien sortant):
  - Exemples: Biocoop (infos catégories/gammes), boutiques zéro‑déchet, reconditionné (Back Market pour inspiration, mais attention droits), artisanat local (Etsy pour inspiration — respecter ToS)…
- Open Data/Registres:
  - INPI/SIRENE pour infos entreprise (localisation, PME), données publiques sur labels/certifications quand disponibles.

Important légal: respecter les conditions d’utilisation/scraping des sites tiers. Préférer:

- Données publiques sous licence compatible ou partenariats léger (autorisation par e‑mail),
- Référencement avec liens sortants + attribution, sans stocker de contenus protégés (texte/images) au‑delà de ce que la licence permet.

### Schéma produit minimal (draft)

```
id: string
title: string
description: string
category: string[]
price: number
currency: EUR
url: string
merchant: { name: string, region: string, small_business: boolean }
eco: {
	certifications: string[]        // ex: EU Ecolabel, GOTS, FSC, B-Corp (entreprise)
	materials: string[]             // ex: coton bio, bois PEFC, recyclé
	origin_country: string          // FR, EU
	repairability_score?: number    // 0–10 si dispo
	second_hand?: boolean
	packaging?: string              // recyclable, vrac, consigné
	co2_estimate?: number           // optionnel, gCO2e si source fiable
}
logistics: {
	ships_to: string[]              // FR/EU
	delivery_time_est?: string
}
images?: string[]
```

### Process d’ingestion (cold‑start)

1. Curation manuelle d’une liste d’entreprises locales conformes à la charte éco.
2. Pour chaque boutique: sélectionner 5–20 produits cadeau‑compatibles (prix indicatif, description courte, URL).
3. Annoter les attributs éco à partir de sources fiables (labels affichés, matériaux). Noter la source (URL) pour audit.
4. Générer embeddings (FR/EN multilingues) sur titre+description pour la recherche sémantique.
5. Mettre en place filtres “durs” (prix, région, label requis) + règles de diversité.

### Langue des données

- FR-only front. Pour les embeddings/recherche, privilégier des modèles multilingues:
  - text-embedding-3-small (multilingue) ou jina-embeddings-v2-base-fr (focus FR, open-source).
- Contenu source en FR si possible pour cohérence. Les sources EN restent utilisables si les attributs sont normalisés (labels sont internationaux).

### Score éco (v1 simple)

Pondération heuristique transparente, par exemple:

- +3 si certification produit (EU Ecolabel/GOTS/Fairtrade),
- +2 si matériau recyclé/bio durable,
- +2 si fabrication FR/EU courte distance,
- +1 si emballage recyclable/vrac/consigné,
- +1 si PME locale,
- +bonus si réparabilité élevée, –malus si jetable/obsolescence évidente.
  Afficher “pourquoi” dans la fiche pour éviter le greenwashing perçu.

## Sécurité et conformité (notes rapides)

- Ne pas inventer de claims éco: s’appuyer uniquement sur attributs présents/sourcés.
- Mentionner les labels au niveau correct (produit vs entreprise).
- RGPD: éviter de collecter des données personnelles sensibles; logs anonymisés.

## Prochaines étapes

- [ ] Définir la charte éco (labels acceptés, seuils, exclusions)
- [ ] Lister 50–100 produits FR/NA avec attributs et sources
- [ ] Implémenter embeddings + recherche locale (FAISS) et filtres
- [ ] Prompt LLM pour: extraction d’intentions + génération d’explications
- [ ] Évaluer sur 20 scénarios types (budget, destinataire, occasion)

## Modèles et données (moyen terme)

### Modèles recommandés (open‑source/local friendly)

- LLM (génération/orchestration)

  - Llama 3 (7–8B) Instruct: multilingue correct, quantifiable (GGUF 4–8 bits), bon compromis qualité/latence locale.
  - Mistral 7B Instruct / Mixtral 8x7B (plus lourd, meilleure qualité, besoin GPU).
  - Qwen 7B/14B Instruct: bonne compréhension multi‑langue, alternatives viables.
  - Astuce: servir localement via llama.cpp/Ollama; limiter max_tokens et activer le cache.

- Embeddings (recherche sémantique FR)

  - jina-embeddings-v2-base-fr (orienté FR, open).
  - bge-m3 (multilingue, robuste pour retrieval).
  - Baseline rapide: paraphrase-multilingual-MiniLM-L12-v2 (Sentence-Transformers).

- Reranker (reclassement)

  - bge-reranker-large (multilingue), ou sa variante base si ressources limitées.

- Index/vector DB
  - FAISS local (zéro coût).
  - Qdrant OSS si besoin d’API/vector store dédié.

### Fine‑tuning vs RAG

- Préférer RAG + règles pour la pertinence factuelle; le fine‑tuning sert surtout à la forme (ton, style, structure d’explication).
- Si nécessaire, faire un LoRA léger (500–2k paires FR « intention → liste justifiée ») pour uniformiser la présentation.
- En parallèle, entraîner un petit reranker (Sentence‑Transformers) avec négatifs difficiles issus de votre catalogue pour améliorer nDCG/MRR.

### Jeux de données utiles (inspiration/éval)

- Éco‑labels et entreprises
  - EU Ecolabel: catalogue public de produits/services certifiés.
  - GOTS (textile bio), Fairtrade/Commerce Équitable, FSC/PEFC (bois/papier), Cosmébio/Ecocert (cosmétiques): annuaires de titulaires.
  - B Lab (B‑Corp): annuaire d’entreprises certifiées (niveau entreprise, pas produit).
- Open data FR
  - data.gouv.fr: rechercher « écolabel », « réparabilité », « circuits courts », « entreprises ».
  - SIRENE (INSEE): infos entreprises (localisation, taille) pour tag « PME locale ».
  - ADEME Base Carbone: facteurs d’émission (vérifier licence/conditions d’usage).
- Produits ouverts (catégories cadeaux possibles)
  - Open Food Facts (alimentaire), Open Beauty Facts (cosmétiques) — attributs utiles, attention aux licences et champs incomplets.

Notes licence: vérifier ToS/licences; privilégier données publiques/partenariats légers; citer la source et éviter la copie d’images/textes protégés.

### Sites sources à explorer (curation manuelle)

- ADEME (guides/annuaires), EU Ecolabel (produits certifiés), GOTS/Fairtrade/FSC/PEFC/Cosmébio/Ecocert (recherche de titulaires).
- B‑Corp directory (cibler entreprises locales responsables pour idées cadeaux/services).
- Annuaire CCI/CMA Nouvelle‑Aquitaine, plateformes régionales « circuits courts ».
- Boutiques zéro‑déchet/vrac locales (avec autorisation), reconditionné (inspiration; respecter ToS).

### Stratégie d’adaptation sans dataset propre

- Générer des scénarios FR (budget, destinataire, occasion) → récupérer top‑k via retrieval + filtres → labelliser automatiquement des paires (query, produits pertinents) → entraîner le reranker.
- Produire des explications initiales avec LLM et valider manuellement un échantillon pour constituer un set de style (LoRA optionnel).
- En prod, collecter clics/sauvegardes/rejets (anonymisés) pour affiner.
