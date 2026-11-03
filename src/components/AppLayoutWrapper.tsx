"use client";

import React, { useEffect, useState } from "react";

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

export const AppLayoutWrapper: React.FC<AppLayoutWrapperProps> = ({ children }) => {
  const [compact, setCompact] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const salvo = localStorage.getItem("bancadalab_sidebar_compact") === "true";
      setCompact(salvo);

      const handleSidebarChange = (e: any) => {
        if (e.detail !== undefined) {
          setCompact(Boolean(e.detail));
        }
      };

      window.addEventListener("sidebar-compact-change", handleSidebarChange);
      return () => {
        window.removeEventListener("sidebar-compact-change", handleSidebarChange);
      };
    }
  }, []);

  return (
    <main
      className={`flex-1 min-w-0 transition-all duration-200 ${
        compact ? "md:pl-20" : "md:pl-64"
      }`}
    >
      {children}
    </main>
  );
};
