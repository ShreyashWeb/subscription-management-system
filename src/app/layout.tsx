import type { Metadata } from "next";
import { Inter, Sora, Space_Grotesk, Manrope } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/layout/command-palette";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Brightloop Billing | Subscription Management",
  description: "One platform for plans, subscriptions, invoices, payments and revenue reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${spaceGrotesk.variable} ${manrope.variable} dark antialiased`}
    >
      <body className="min-h-screen text-[#f5f5fa] font-sans selection:bg-[#6d5dfc]/30 selection:text-white">
        {children}
        <CommandPalette />
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );
}
