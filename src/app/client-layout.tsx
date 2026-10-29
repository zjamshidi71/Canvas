"use client";

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArtAdvisor from "@/components/ArtAdvisor";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />
        <main className="flex-1 pt-16 lg:pt-20">{children}</main>
        <Footer />
        <ArtAdvisor />
      </CartProvider>
    </AuthProvider>
  );
}
