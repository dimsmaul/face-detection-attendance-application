"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { users } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (users.token) {
      router.replace("/dashboard");
    }
  }, [users, router]);

  return <>{children}</>;
}
