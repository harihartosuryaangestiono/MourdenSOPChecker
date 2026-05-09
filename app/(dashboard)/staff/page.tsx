"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PremiumLoading } from "@/components/common/PremiumLoading";

export default function StaffDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/staff/tasks");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <PremiumLoading />
    </div>
  );
}
