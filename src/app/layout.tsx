"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const { setUserData } = useAuth();
  
  useEffect(() => {
    const checkToken = async () => {
      // Skip token check for login page
      if (window.location.pathname.includes('/signin')) {
        setLoading(false);
        return;
      }

      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          
          if (!token) {
            setLoading(false);
            throw new Error('Token not found');
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token-check`, {
            headers: {
              'Authorization': `${token}`,
              'ngrok-skip-browser-warning': 'true'
            },
            cache: 'no-store'
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserData(data.data);
          } else {
            localStorage.removeItem('token');
            setUserData(null);
            router.replace('/');
          }
        }
      } catch (error) {
        localStorage.removeItem('token');
        setUserData(null);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [setUserData, router]);

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {loading ? <Loader /> : children}
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <RootLayoutContent>{children}</RootLayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
