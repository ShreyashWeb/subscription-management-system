import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${spaceGrotesk.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#07070d] text-[#f5f5fa] font-sans selection:bg-[#6d5dfc]/30 selection:text-white">
        {children}
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );
}
