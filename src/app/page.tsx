"use client";

import dynamic from "next/dynamic";

// Dynamically import the home page content to avoid SSR issues with context hooks
const HomePageContent = dynamic(() => import("@/components/pages/HomePage"), {
  ssr: false,
});

export default function Page() {
  return <HomePageContent />;
}
