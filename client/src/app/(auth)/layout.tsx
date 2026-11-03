import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { AuthShowcase } from "@/features/auth/components/auth-showcase";
import { ResetClientState } from "@/features/auth/components/reset-client-state";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <ResetClientState />
      <div className="flex min-h-full flex-col bg-surface px-5 py-6 sm:px-10">
        <Link href="/" className="w-fit rounded-md" aria-label="Relay home">
          <Logo />
        </Link>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[360px]">{children}</div>
        </main>
        <p className="text-xs text-faint">Protected with encrypted, HttpOnly session cookies.</p>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-line bg-canvas lg:flex">
        <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0" />
        <AuthShowcase />
      </aside>
    </div>
  );
}
