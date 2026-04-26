import type { Metadata } from "next";

export const metadata: Metadata = { title: "Session Detail" };

interface SessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionDetailPage({ params }: SessionPageProps) {
  const { sessionId } = await params;

  return (
    <div>
      <SessionDetailClient sessionId={sessionId} />
    </div>
  );
}

// Client wrapper to avoid top-level async component for client hooks
import SessionDetailClient from "@/components/agents/SessionDetailClient";
