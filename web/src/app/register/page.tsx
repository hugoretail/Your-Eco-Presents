"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setError("Email invalide"); return;
    }
    if (password.length < 6) {
      setError("Mot de passe trop court"); return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas"); return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erreur d'inscription");
      return;
    }
    setSuccess("Compte créé ! Vérifiez vos mails pour confirmer votre adresse.");
    setEmail(""); setPassword(""); setConfirm("");
    // Optionnel : rediriger vers /login ici.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-50 px-4">
      <form onSubmit={handleRegister} className="w-full max-w-md space-y-6 rounded-2xl border border-neutral-200 bg-white/95 p-8 shadow-lg backdrop-blur">
        <h1 className="text-3xl font-bold text-emerald-800 mb-2">Créer un compte</h1>
        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1">Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            placeholder="Votre email" />
        </div>
        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1">Mot de passe</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            placeholder="Votre mot de passe" />
        </div>
        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1">Confirmer le mot de passe</label>
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            placeholder="Confirmez le mot de passe" />
        </div>
        {error && <p className="text-base text-red-700 font-semibold rounded-lg border border-red-200 bg-red-50 px-3 py-2">{error}</p>}
        {success && <p className="text-base text-emerald-700 font-semibold rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">{success}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-emerald-600 py-2 text-lg font-bold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition">{loading ? "Création…" : "Créer le compte"}</button>
        <p className="text-sm text-neutral-600 text-center mt-2">Déjà inscrit ? <a href="/login" className="text-emerald-700 underline font-semibold">Se connecter</a></p>
      </form>
    </div>
  );
}
