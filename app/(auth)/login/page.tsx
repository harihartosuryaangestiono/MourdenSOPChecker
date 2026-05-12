"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, getDashboardRoute } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, CheckCircle, Shield, Eye, EyeOff } from "lucide-react";
import { APP_NAME, CAFE_NAME } from "@/lib/constants";
import { motion } from "framer-motion";
import Image from "next/image";

const features = [
  { text: "Mandatory photo proof per task" },
  { text: "Real-time operational monitoring" },
  { text: "Multi-shift SOP tracking" },
  { text: "Performance analytics & reporting" },
];

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { user } = await login(email, password);
      if (!user) { toast.error("Login gagal. Silakan coba lagi."); return; }
      const role = (user.user_metadata?.role as "owner" | "admin" | "staff") || "staff";
      toast.success("Selamat datang kembali!");
      router.push(getDashboardRoute(role));
      router.refresh();
    } catch {
      toast.error("Email atau password salah.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left – Brand Panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-[hsl(30,12%,8%)]">
        {/* Background rings */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-white/10" />
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg">
              <Image src="/logo.png" alt="Mourden" width={40} height={40} className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">{APP_NAME}</span>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">
                Café Operations Platform
              </p>
              <h1 className="text-4xl font-bold text-white leading-tight mb-5">
                Every Task.<br />Every Proof.<br />Every Day.
              </h1>
              <p className="text-white/50 text-base leading-relaxed mb-10">
                The digital SOP monitoring platform built for premium café operations. Streamline execution, capture proof, and track performance in real time.
              </p>
              <ul className="space-y-3">
                {features.map((f, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center gap-3 text-white/70 text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {f.text}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          <p className="text-white/25 text-xs relative z-10">
            &copy; {new Date().getFullYear()} {CAFE_NAME}. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right – Form Panel */}
      <div className="flex-1 lg:max-w-[480px] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
              <Image src="/logo.png" alt="Mourden" width={36} height={36} className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-foreground">{APP_NAME}</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1.5">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-8">Sign in to your operations dashboard</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 bg-secondary/50 border-border/50 focus:border-primary focus:bg-background transition-all rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 bg-secondary/50 border-border/50 focus:border-primary focus:bg-background transition-all rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold mt-2 shadow-md hover:shadow-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Secured with Supabase Auth</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
