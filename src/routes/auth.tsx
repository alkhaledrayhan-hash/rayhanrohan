import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Home, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Ayesha Maison Qatar" },
      { name: "description", content: "Sign in or create your Ayesha Maison Qatar account." },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or username").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscore only"),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  role: z.enum(["user", "agent"]),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"user" | "agent">("user");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      identifier: form.get("identifier"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    let email = parsed.data.identifier;
    if (!email.includes("@")) {
      const { data, error: rpcError } = await supabase.rpc("get_email_by_username", {
        _username: email,
      });
      if (rpcError || !data) {
        setLoading(false);
        return toast.error("Invalid username or password");
      }
      email = data as string;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: form.get("fullName"),
      username: form.get("username"),
      email: form.get("email"),
      password: form.get("password"),
      role,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: parsed.data.fullName,
          username: parsed.data.username,
          // Note: role is intentionally NOT sent. All signups become 'user'.
          // Agent role must be granted by an admin via the admin panel.
          requested_role: parsed.data.role,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(
      parsed.data.role === "agent"
        ? "Account created! An admin must approve your agent access."
        : "Account created! You're signed in.",
    );
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1a0a0f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,38,53,0.4),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(212,175,55,0.15),transparent_50%)]" />
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

          <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Field
                    label="Email or Username"
                    name="identifier"
                    type="text"
                    placeholder="you@example.com or username"
                  />
                  <Field label="Password" name="password" type="password" placeholder="••••••••" />
                  <div className="text-right">
                    <Link
                      to="/auth/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>I want to sign up as</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { v: "user", label: "Customer", desc: "Browse & book properties" },
                        { v: "agent", label: "Agent", desc: "List properties (approval required)" },
                      ] as const).map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setRole(opt.v)}
                          className={`rounded-lg border p-3 text-left text-xs transition ${
                            role === opt.v
                              ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-sm font-semibold">{opt.label}</div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Full Name" name="fullName" placeholder="Jane Doe" />
                  <Field label="Username" name="username" placeholder="janedoe" />
                  <Field label="Email" name="email" type="email" placeholder="you@example.com" />
                  <Field
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Min 6 characters"
                  />
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create {role === "agent" ? "Agent" : "Customer"} Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="mt-6 text-center text-xs text-white/60">
            By continuing you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  const isPassword = type === "password";
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {isPassword ? (
        <div className="relative">
          <Input
            id={name}
            name={name}
            type={show ? "text" : "password"}
            placeholder={placeholder}
            required
            className="pr-10"
            autoComplete={name === "password" ? "current-password" : undefined}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <Input id={name} name={name} type={type} placeholder={placeholder} required />
      )}
    </div>
  );
}
