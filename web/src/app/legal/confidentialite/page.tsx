export default function PolitiqueConfidentialite() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 space-y-8 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight title-gradient">Politique de confidentialité</h1>
        <p className="text-sm text-neutral-700">Transparence sur nos pratiques.</p>
      </div>
      {/* Conteneur lisible avec fond et bordure légers */}
      <div className="prose max-w-none prose-neutral legal-prose bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2>Essentiel à retenir</h2>
        <ul>
          <li>Nous ne revendons pas vos données. Jamais.</li>
          <li>Les informations saisies pour générer des idées sont chiffrées en transit (HTTPS) et au repos (base).</li>
          <li>Nous collectons le minimum nécessaire: email pour l’authentification, préférences facultatives.</li>
          <li>Vous gardez le contrôle: modifier, exporter, supprimer votre compte et vos données à tout moment.</li>
        </ul>

        <h2>Données collectées</h2>
        <ul>
          <li><strong>Compte</strong>: adresse email, mot de passe chiffré (hashé), nom d’affichage.</li>
          <li><strong>Préférences</strong>: thème, abonnements, options facultatives.</li>
          <li><strong>Idées enregistrées</strong>: références de produits sauvegardés par vous.</li>
          <li><strong>Journaux techniques</strong> (limités): diagnostics d’erreur, agrégés.</li>
        </ul>

        <h2>Finalités</h2>
        <ul>
          <li>Authentification et sécurité du compte.</li>
          <li>Personnalisation (préférences) et sauvegarde de vos idées.</li>
          <li>Amélioration du service (statistiques anonymisées et agrégées).</li>
        </ul>

        <h2>Sécurité & chiffrement</h2>
        <ul>
          <li>Transport chiffré par HTTPS (TLS).</li>
          <li>Chiffrement au repos des données applicatives (base de données).</li>
          <li>Mots de passe stockés uniquement sous forme de <em>hash sécurisé</em> (jamais en clair).</li>
          <li>Accès interne restreint et journalisé.</li>
        </ul>

        <h2>Vos droits</h2>
        <p>Depuis l’onglet <a href="/compte">Mon compte</a>, vous pouvez:</p>
        <ul>
          <li>Mettre à jour vos informations et préférences</li>
          <li>Consulter et supprimer vos idées enregistrées</li>
          <li>Changer de mot de passe</li>
          <li>Supprimer définitivement votre compte</li>
        </ul>

        <h2>Contact</h2>
        <p>Pour toute question liée aux données: <a href="mailto:contact@example.com">contact@eco-presents.com</a>.</p>
      </div>
    </div>
  );
}
