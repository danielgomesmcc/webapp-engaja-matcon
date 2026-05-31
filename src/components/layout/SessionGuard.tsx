"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface SessionGuardProps {
  mustChangePassword: boolean;
}

export default function SessionGuard({ mustChangePassword }: SessionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (mustChangePassword && !pathname.startsWith("/perfil")) {
      router.replace("/perfil?firstAccess=1");
    }
  }, [mustChangePassword, pathname, router]);

  return null;
}
