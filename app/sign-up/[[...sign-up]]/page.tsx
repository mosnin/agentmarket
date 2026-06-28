import { SignUp } from "@clerk/nextjs";

import { isRealAuthConfigured } from "@/lib/authConfig";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  if (!isRealAuthConfigured) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Authentication isn&apos;t configured in this environment.
      </main>
    );
  }
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <SignUp />
    </main>
  );
}
