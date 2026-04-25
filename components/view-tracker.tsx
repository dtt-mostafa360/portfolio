"use client";

import { useEffect } from "react";

export function ViewTracker({ repo }: { repo: string }) {
  useEffect(() => {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo }),
    });
  }, [repo]);

  return null;
}
