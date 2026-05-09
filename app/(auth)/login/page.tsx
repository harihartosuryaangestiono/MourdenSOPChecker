"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login, getDashboardRoute } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, Coffee, Shield, CheckCircle } from "lucide-react";
import { CAFE_NAME, APP_NAME } from "@/lib/constants";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user } = await login(email, password);
      
      if (!user) {
        toast.error("Login gagal. Silakan coba lagi.");
        return;
      }

      const role = (user.user_metadata?.role as "owner" | "admin" | "staff") || "staff";
      const redirectTo = getDashboardRoute(role);
      
      toast.success("Login berhasil!");
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Email atau password salah.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Side - Hero / Branding */}
      <div className="hidden md:flex flex-col flex-1 bg-zinc-900 text-white p-12 justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-brand-gold mb-12">
            <Coffee className="w-8 h-8" />
            <span className="font-display text-2xl font-bold tracking-tight">{APP_NAME}</span>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md"
          >
            <h1 className="text-4xl font-bold leading-tight mb-6">
              Operational excellence for premium cafes
            </h1>
            <p className="text-zinc-400 text-lg mb-8">
              Every Task. Every Proof. Every Day. Streamline your operations with our digital SOP monitoring platform.
            </p>
            
            <div className="space-y-4">
              {[
                "Mandatory photo proof per task",
                "Real-time operational monitoring",
                "Performance analytics & reporting"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle className="w-5 h-5 text-brand-gold" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        
        <div className="relative z-10 text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} {CAFE_NAME}. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8 md:hidden">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center mb-4 shadow-lg">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-lg bg-card/50 backdrop-blur-sm sm:card-premium">
            <CardHeader className="space-y-1 pb-8 text-center sm:text-left">
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
              <CardDescription className="text-base">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-secondary/50 border-transparent focus:border-primary focus:bg-background transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-secondary/50 border-transparent focus:border-primary focus:bg-background transition-all"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base shadow-md hover:shadow-lg transition-all" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
                
                <div className="mt-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  Secure login with Supabase Auth
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
