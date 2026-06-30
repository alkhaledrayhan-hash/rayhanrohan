import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Home, Loader2, MessageCircle, Smartphone } from "lucide-react";
import { AuthBackground } from "@/components/site/AuthBackground";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useServerFn } from "@tanstack/react-router";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/phone-otp.functions";


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
  const settings = useSiteSettings();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"user" | "agent">("user");
  const sendOtp = useServerFn(sendPhoneOtp);
  const verifyOtp = useServerFn(verifyPhoneOtp);

  const googleOn = settings.auth_google_enabled === "true";
  const appleOn = settings.auth_apple_enabled === "true";
  const smsOn = settings.auth_phone_sms_enabled === "true";
  const waOn = settings.auth_phone_whatsapp_enabled === "true";
  const phoneOn = smsOn || waOn;

  async function routeByRole() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return navigate({ to: "/dashboard" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const set = new Set((roles ?? []).map((r: any) => r.role));
    if (set.has("admin") || set.has("agent")) navigate({ to: "/admin" });
    else navigate({ to: "/dashboard" });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) routeByRole();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    await routeByRole();
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

  async function handleOAuth(provider: "google" | "apple") {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || `Could not sign in with ${provider}`);
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      await routeByRole();
    } catch (err: any) {
      toast.error(err?.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex flex-col items-center justify-center gap-3 text-white">
            <div className="flex items-center gap-2">
              {settings.site_logo_url ? (
                <img
                  src={settings.site_logo_url}
                  alt={settings.site_title}
                  className="h-10 w-10 rounded-md object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Home className="h-5 w-5" />
                </span>
              )}
              <span className="font-display text-xl font-semibold">
                {settings.auth_heading || settings.site_title}
              </span>
            </div>
            {settings.auth_subheading && (
              <span className="text-center text-sm text-white/70">{settings.auth_subheading}</span>
            )}
          </Link>

          <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className={`grid w-full ${phoneOn ? "grid-cols-3" : "grid-cols-2"}`}>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                {phoneOn && <TabsTrigger value="phone">Phone</TabsTrigger>}
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                {settings.auth_signin_heading && (
                  <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                    {settings.auth_signin_heading}
                  </h2>
                )}
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

                {(googleOn || appleOn) && (
                  <SocialButtons
                    googleOn={googleOn}
                    appleOn={appleOn}
                    loading={loading}
                    onClick={handleOAuth}
                  />
                )}
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                {settings.auth_signup_heading && (
                  <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                    {settings.auth_signup_heading}
                  </h2>
                )}
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

                {(googleOn || appleOn) && (
                  <SocialButtons
                    googleOn={googleOn}
                    appleOn={appleOn}
                    loading={loading}
                    onClick={handleOAuth}
                  />
                )}
              </TabsContent>

              {phoneOn && (
                <TabsContent value="phone" className="mt-6">
                  <PhoneOtpForm
                    smsOn={smsOn}
                    waOn={waOn}
                    sendOtp={sendOtp}
                    verifyOtp={verifyOtp}
                    onSuccess={routeByRole}
                  />
                </TabsContent>
              )}
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

function SocialButtons({
  googleOn,
  appleOn,
  loading,
  onClick,
}: {
  googleOn: boolean;
  appleOn: boolean;
  loading: boolean;
  onClick: (p: "google" | "apple") => void;
}) {
  return (
    <div className="mt-5">
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
          <span className="bg-white px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>
      <div className="grid gap-2">
        {googleOn && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onClick("google")}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
              <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z"/>
              <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.46 1.5 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 4.75 12 4.75Z"/>
            </svg>
            Continue with Google
          </button>
        )}
        {appleOn && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onClick("apple")}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16.37 12.62c.02 2.45 2.14 3.27 2.16 3.28-.02.06-.34 1.16-1.12 2.3-.67 1-1.37 1.99-2.47 2.01-1.08.02-1.43-.64-2.66-.64-1.23 0-1.62.62-2.65.66-1.06.04-1.87-1.08-2.55-2.07-1.39-2-2.45-5.66-1.02-8.13.71-1.23 1.98-2.01 3.36-2.03 1.04-.02 2.03.71 2.66.71.64 0 1.83-.87 3.09-.74.53.02 2.01.22 2.96 1.62-.08.05-1.77 1.03-1.76 3.03ZM14.55 5.42c.56-.69.95-1.64.84-2.59-.81.03-1.79.54-2.38 1.23-.52.6-.99 1.57-.86 2.5.91.07 1.83-.45 2.4-1.14Z"/>
            </svg>
            Continue with Apple
          </button>
        )}
      </div>
    </div>
  );
}

function PhoneOtpForm({
  smsOn,
  waOn,
  sendOtp,
  verifyOtp,
  onSuccess,
}: {
  smsOn: boolean;
  waOn: boolean;
  sendOtp: (args: { data: { phone: string; channel: "sms" | "whatsapp" } }) => Promise<any>;
  verifyOtp: (args: { data: { phone: string; code: string } }) => Promise<any>;
  onSuccess: () => Promise<void> | void;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp">(smsOn ? "sms" : "whatsapp");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    if (phone.trim().length < 6) return toast.error("Enter a valid phone number with country code");
    setBusy(true);
    try {
      await sendOtp({ data: { phone, channel } });
      toast.success(`Code sent via ${channel === "sms" ? "SMS" : "WhatsApp"}`);
      setStage("code");
    } catch (e: any) {
      toast.error(e?.message || "Could not send code");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!/^\d{6}$/.test(code)) return toast.error("Enter the 6-digit code");
    setBusy(true);
    try {
      const res = await verifyOtp({ data: { phone, code } });
      const { error } = await supabase.auth.verifyOtp({
        type: "magiclink",
        email: res.email,
        token_hash: res.token_hash,
      } as any);
      if (error) throw error;
      toast.success("Signed in!");
      await onSuccess();
    } catch (e: any) {
      toast.error(e?.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {smsOn && waOn && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setChannel("sms")}
            className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs transition ${
              channel === "sms" ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary/50"
            }`}
          >
            <Smartphone className="h-4 w-4" /> SMS
          </button>
          <button
            type="button"
            onClick={() => setChannel("whatsapp")}
            className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs transition ${
              channel === "whatsapp" ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary/50"
            }`}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </button>
        </div>
      )}

      {stage === "phone" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="otp-phone">Phone number</Label>
            <Input
              id="otp-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+974 5xxx xxxx"
            />
            <p className="text-[11px] text-muted-foreground">Include country code (e.g. +974).</p>
          </div>
          <Button onClick={handleSend} disabled={busy} className="w-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send code via {channel === "sms" ? "SMS" : "WhatsApp"}
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="otp-code">Enter the 6-digit code</Label>
            <Input
              id="otp-code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
            />
            <button
              type="button"
              onClick={() => { setStage("phone"); setCode(""); }}
              className="text-[11px] text-primary hover:underline"
            >
              Use a different number
            </button>
          </div>
          <Button onClick={handleVerify} disabled={busy} className="w-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & sign in
          </Button>
        </>
      )}
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
