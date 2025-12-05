export default function MentionsLegales() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 space-y-8 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight title-gradient">Mentions légales</h1>
        <p className="text-sm text-neutral-700">Informations réglementaires relatives à l’éditeur, l’hébergeur et l’utilisation du site.</p>
      </div>

      <div className="prose max-w-none prose-neutral legal-prose bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2>1. Éditeur du site</h2>
        <p>
          Nom du site: <strong>Eco-Presents</strong><br/>
          Éditeur / Responsable de publication: <em>Hugo Retail</em><br/>
          Contact: <a href="mailto:hugo.retaill@gmail.com">hugo.retaill@gmail.com</a>
        </p>

        <h2>2. Hébergeur</h2>
        <p>
          Hébergeur: <em>Vercel</em><br/>
          Site: <em><a href="/legal/confidentialite">Vercel.com</a></em>
        </p>

        <h2>3. Propriété intellectuelle</h2>
        <p>
          Sauf mention contraire, l’ensemble des contenus (textes, images, logos, interfaces, code) présents sur le site sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle, est interdite sans autorisation écrite préalable.
        </p>

        <h2>4. Données personnelles</h2>
        <p>
          Les traitements de données mis en œuvre et vos droits sont détaillés dans notre <a href="/legal/confidentialite">Politique de confidentialité</a>. Vous pouvez nous contacter à tout moment pour exercer vos droits: <a href="mailto:hugo.retaill@gmail.com">hugo.retaill@gmail.com</a>.
        </p>

        <h2>5. Cookies</h2>
        <p>
          Le site peut déposer des cookies nécessaires à son bon fonctionnement et, avec votre consentement, des cookies de mesure anonyme d’audience. Vous pouvez gérer vos préférences à tout moment depuis la bannière cookies.
        </p>

        <h2>6. Liens externes</h2>
        <p>
          Des liens vers des sites tiers peuvent être proposés. Nous n’exerçons aucun contrôle sur leur contenu et déclinons toute responsabilité quant aux informations qui y sont présentées.
        </p>

        <h2>7. Limitation de responsabilité</h2>
        <p>
          L’éditeur ne saurait être tenu pour responsable des dommages directs ou indirects consécutifs à l’accès au site ou à l’utilisation des informations qui y sont présentées. Le service est fourni «&nbsp;en l’état&nbsp;» sans garantie de disponibilité continue.
        </p>

        <h2>8. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont régies par le droit français. En cas de litige et à défaut de résolution amiable, compétence est attribuée aux tribunaux français compétents.
        </p>

        <hr/>
      </div>
    </div>
  );
}
