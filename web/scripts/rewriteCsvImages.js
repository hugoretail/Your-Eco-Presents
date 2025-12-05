// Rewrite CSV "image" field to an existing product image (or /logo.png fallback)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const CSV_PATH = path.resolve(__dirname, '..', '..', 'tmp', 'articles.csv');

function chooseImage(rec) {
  const lower = [
    rec.name, rec.description, rec.brand, rec.url,
    rec.labels, rec.origin, rec.materials, rec.packaging,
    rec.keywords, rec.categories
  ]
    .filter(Boolean)
    .map(String)
    .join(' | ')
    .toLowerCase();

  // Ordered pattern mapping; first match wins
  const patterns = [
    [/bo[iî]te\s*à\s*bijoux|boite\s*a\s*bijoux|bo[iî]te a bijoux/, 'Boîte à bijoux.webp'],
    [/bandeau/, 'Bandeau femme.webp'],
    [/bijou[x]?/, 'Bijoux.webp'],
    [/bonnet/, 'Bonnet en laine.webp'],
    [/bougie/, 'Bougie.webp'],
    [/personnali[s|z]e/, 'Cadeau personnalisé.webp'],
    [/carnet/, 'Carnet de lecture.webp'],
    [/casquette/, 'Casquette.webp'],
    [/catalogue|expo|exposition/, 'Catalogue d’expo.webp'],
    [/chausson/, 'Chaussons.webp'],
    [/concert|live|sc[èe]ne|musique.*(concert|live)/, 'Concert musical.webp'],
    [/cosm[ée]tique|soin/, 'Cosmétiques.webp'],
    [/d[ée]co.*bois|bois.*d[ée]co|d[ée]coration.*bois/, 'Deco en bois musique.webp'],
  [/doudou/, 'Doudou.webp'],
  [/restaurant|d[ée]jeuner|d[îi]ner|repas|gastronomie/, 'Restaurant.webp'],
  [/exp[ée]rience|sensorielle|immersif/, 'Expérience sensorielle.webp'],
    [/(é|e)charpe/, 'Écharpe.webp'],
    [/gourde/, 'Gourde.webp'],
    [/huile[s]?\s*essentielle[s]?|aromath[ée]rapie/, 'Huiles essentielles.webp'],
    [/cyanotype/, 'Kit cyanotype.webp'],
    [/marque[-\s]?page/, 'Marque page personnalisé.webp'],
    [/match|foot|stade|girondins/, 'Match de foot.webp'],
    [/montre|watch/, 'Montre.webp'],
    [/peignoir|peignoire/, 'Peignoire.webp'],
    [/plaid|couverture/, 'Plaid.webp'],
    [/porte[-\s]?monnaie/, 'Porte monnaie.webp'],
    [/poster|affiche/, 'Poster avec Autographe chanteur.webp'],
    [/pyjama/, 'Pyjama.webp'],
  [/raquette|tennis|ping[-\s]?pong|badminton/, 'Raquette.webp'],
    [/sacoche/, 'Sacoche Homme.webp'],
    [/(sac\s*[àa]\s*main)|pochette|besace/, 'Sac à main.webp'],
    [/sac.*(sport|duffel|voyage)|duffel|bagage/, 'Sac de sport voyage .webp'],
    [/serviette|towel|torchon/, 'Serviette de sport.webp'],
    [/shampoing|shampooing|cheveux/, 'Shampoing.webp'],
    [/stand[\s\-]?up|humour|com[ée]die/, 'Stand Up.webp'],
    [/stream|svod|abonnement.*(vid[ée]o|musique)/, 'Streaming.webp'],
    [/(t\s*[- ]?shirt|tee[- ]?shirt)/, (l) => (l.includes('musique') ? 'T-shirt musique.webp' : 'T shirt de sport.webp')],
    [/th[ée]âtre|cin[ée]ma|spectacle/, 'Théâtre,Cinéma.webp'],
    [/vinyle|disque|lp|33\s*tours|45\s*tours/, 'Vinyle musique.webp'],
    [/week[-\s]?end|s[ée]jour|escapade|voyage/, 'Weekend.webp'],
    [/gant.*d[ée]maquillant/, 'Gant démaquillant .webp'],
  ];

  for (const [re, img] of patterns) {
    if (re.test(lower)) {
      if (typeof img === 'function') {
        const chosen = img(lower);
        return `/products/${chosen}`;
      }
      return `/products/${img}`;
    }
  }
  return '/logo.png';
}

function quoteCsv(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV not found:', CSV_PATH);
    process.exit(1);
  }
  const input = fs.readFileSync(CSV_PATH, 'utf8');
  const records = parse(input, { columns: true, skip_empty_lines: true, bom: true, trim: true });

  // Desired column order matching importer expectations
  const columns = [
    'name','description','brand','url','priceCents','currency','labels','origin','materials','repairScore','packaging','image','keywords','categories','popularity','ecoScore','purchaseLinks'
  ];

  const outputLines = [];
  outputLines.push(columns.map(quoteCsv).join(','));

  for (const rec of records) {
    // Assign image based on mapping
    rec.image = chooseImage(rec);

    const line = columns.map((col) => quoteCsv(rec[col] ?? ''));
    outputLines.push(line.join(','));
  }

  const output = outputLines.join('\n');
  fs.writeFileSync(CSV_PATH, output, 'utf8');
  console.log(`Rewrote images for ${records.length} rows -> ${path.relative(process.cwd(), CSV_PATH)}`);
}

main();
