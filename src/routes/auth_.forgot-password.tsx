import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Home, Loader2 } from "lucide-react";
import { AuthBackground } from "@/components/site/AuthBackground";


export const Route = createFileRoute("/auth_/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password · Ayesha Maison Qatar" },
      { name: "description", content: "Reset your Ayesha Maison Qatar account password." },
    ],
  }),
  component: ForgotPassword,
});

const schema = z.object({ email: z.string().trim().email("Invalid email").max(255) });

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ email: form.get("email") });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Check your email for the reset link.");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <Home className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-semibold">
              Ayesha Maison <span className="text-gold">Qatar</span>
            </span>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl">
            <h1 className="font-display text-2xl font-semibold">Forgot password?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and we'll send you a reset link.
            </p>

            {sent ? (
              <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="font-medium text-foreground">Email sent.</p>
                <p className="mt-1 text-muted-foreground">
                  Click the link in your inbox to reset your password.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
            )}

            <Link
              to="/auth"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
