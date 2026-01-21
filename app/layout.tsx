import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BudgetBuddy",
  description: "Personal finance tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Shell>
            {children}
          </Shell>
        </Providers>
      </body>
    </html>
  );
}
