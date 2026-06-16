// Root layout pentru pagina /maintenance (fără i18n, design minimal standalone)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platforma în reorganizare — ATPSOR",
  description: "Platforma este temporar indisponibilă",
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body style={{ margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
