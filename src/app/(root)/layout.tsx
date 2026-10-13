import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import esMessages from "@/messages/es.json";
import "../globals.css";

export const metadata: Metadata = {
  title: esMessages.Metadata.title,
  description: esMessages.Metadata.description,
  applicationName: "AgeClarity",
  icons: { icon: "/favicon.svg" },
  alternates: {
    canonical: "/es",
    languages: { es: "/es", en: "/en", pt: "/pt" }
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  setRequestLocale("es");

  return (
    <html lang="es">
      <body>
        <NextIntlClientProvider locale="es" messages={esMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
