import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ManagementAuthProvider } from "@/contexts/ManagementAuthContext";
import { QueryClientProvider } from "@/contexts/QueryClientProvider";
import { NotificationProvider } from "@/components/shared/Notification";
import ToastContainer from "@/components/shared/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bizloan Ops Query Model",
  description: "Operations and Sales Dashboard for Bizloan Query Management",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.png" sizes="any" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0891b2" />
      </head>
            <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProvider>
          <AuthProvider>
            <ManagementAuthProvider>
              <NotificationProvider>
                {children}
                <ToastContainer />
              </NotificationProvider>
            </ManagementAuthProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
