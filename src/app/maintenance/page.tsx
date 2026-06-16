// Pagina de mentenanță afișată cât platforma e offline
// Activată via MAINTENANCE_MODE=true în Vercel env vars

export default function MaintenancePage() {
  return (
    <>
      <style>{`
        .maintenance-wrap {
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .maintenance-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          max-width: 600px;
          padding: 3rem 2.5rem;
          text-align: center;
        }
        .maintenance-icon { font-size: 4rem; margin-bottom: 1.5rem; }
        .maintenance-card h1 { color: #1e3a8a; font-size: 1.75rem; margin-bottom: 1rem; font-weight: 700; }
        .maintenance-card p { color: #4b5563; line-height: 1.6; margin-bottom: 1rem; font-size: 1rem; }
        .contact-box {
          background: #eff6ff;
          border-left: 4px solid #1e40af;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          text-align: left;
          margin-top: 1.5rem;
          font-size: 0.875rem;
          color: #1e3a8a;
        }
        .contact-box strong { display: block; margin-bottom: 0.5rem; }
        .contact-box a { color: #1e40af; text-decoration: none; font-weight: 600; }
        .contact-box-orange {
          background: #fef3c7;
          border-left-color: #d97706;
          color: #92400e;
        }
        .contact-box-orange a { color: #d97706; }
        .footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 0.75rem;
        }
      `}</style>
      <div className="maintenance-wrap">
        <div className="maintenance-card">
          <div className="maintenance-icon">🔧</div>
          <h1>Platforma este în reorganizare</h1>
          <p>
            Această platformă este temporar indisponibilă în urma unor modificări organizaționale.
          </p>
          <p>
            Vă mulțumim pentru înțelegere. Veți fi notificați pe email când platforma va reveni online sub o formă nouă.
          </p>

          <div className="contact-box">
            <strong>📞 Pentru întrebări legate de ATPSOR (Asociația Transportatorilor):</strong>
            George Ciutacu — Secretar Asociație<br/>
            Email: <a href="mailto:smotoceltrans@yahoo.com">smotoceltrans@yahoo.com</a><br/>
            Telefon: +40 721 157 675
          </div>

          <div className="contact-box contact-box-orange">
            <strong>🚌 Pentru servicii de transport ocazional (Luxuria Travel):</strong>
            Email: <a href="mailto:rezervari@luxuriatravel.ro">rezervari@luxuriatravel.ro</a><br/>
            Telefon: 031-419-00-21<br/>
            Urgențe: +40 734 489 107
          </div>

          <div className="footer">atpsor.ro — © 2026</div>
        </div>
      </div>
    </>
  );
}
