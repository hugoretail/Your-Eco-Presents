type ConfirmParams = {
  confirmUrl: string;
  userEmail?: string;
  siteName?: string;
  supportEmail?: string;
};

// Keep emails resilient by sanitizing every user provided fragment.
function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

export function buildConfirmationEmail({ confirmUrl, userEmail, siteName = 'Eco‑Presents', supportEmail }: ConfirmParams) {
  const safeUrl = confirmUrl;
  const safeUser = userEmail ? escapeHtml(userEmail) : undefined;
  const safeSupport = supportEmail || 'hugo.retaill@gmail.com';
  const subject = `Confirme ton compte ${siteName} \u2728`;

  const html = `
  <div style="background:#f6f7f9;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e8eb;">
      <tr>
        <td style="padding:20px 24px;background:#0f172a;color:#fff;font-weight:700;font-size:18px;">
          ${siteName}
        </td>
      </tr>
      <tr>
        <td style="padding:24px 24px 8px;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;color:#0f172a;">Bienvenue${safeUser ? `, ${safeUser}` : ''} \u2728</h1>
          <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#334155;">
            Merci de t’être inscrit·e à ${siteName}. Nous t’aidons à offrir mieux&nbsp;: des idées cadeaux responsables, locales et durables.
          </p>
          <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#334155;">
            Pour activer ton compte, confirme ton adresse email en cliquant sur le bouton ci‑dessous.
          </p>
          <div style="text-align:center;margin:24px 0 8px;">
            <a href="${safeUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;font-size:14px;">Confirmer mon compte</a>
          </div>
          <p style="margin:12px 0 0;font-size:12px;line-height:18px;color:#64748b;">
            Si le bouton ne fonctionne pas, copie/colle ce lien dans ton navigateur :<br />
            <a href="${safeUrl}" style="color:#0ea5e9;word-break:break-all;">${safeUrl}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 24px;">
          <hr style="border:none;height:1px;background:#e6e8eb;margin:0 0 16px;" />
          <p style="margin:0 0 8px;font-size:12px;line-height:18px;color:#64748b;">
            Tu n’es pas à l’origine de cette inscription ? Ignore ce message." style="color:#0ea5e9;">${safeSupport}</a>.
          </p>
          <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;">Merci d’œuvrer pour des cadeaux plus vertueux. \u2728</p>
        </td>
      </tr>
    </table>
  </div>`;

  const text = `Bienvenue${safeUser ? `, ${safeUser}` : ''} !\n\n` +
    `Merci de t’être inscrit·e à ${siteName}. Pour activer ton compte, clique sur le lien suivant :\n` +
    `${safeUrl}\n\n` +
    `Si tu n’es pas à l’origine de cette inscription, ignore ce message.`;

  return { subject, html, text };
}
