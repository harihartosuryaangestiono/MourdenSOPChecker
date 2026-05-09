"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, User as UserIcon, Mail, Shield, Camera, Edit2 } from "lucide-react";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      toast.success("Successfully logged out");
      router.push("/login");
    } catch {
      toast.error("Failed to log out");
    }
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <PremiumLoading />
      </div>
    );
  }

  return (
    <PremiumLayout title="Profile" subtitle="Manage your account settings">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="card-premium overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/80 to-primary" />
          <CardContent className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 mb-6">
              <div className="relative group">
                <UserAvatar name={user.name} avatarUrl={user.avatar_url} className="h-24 w-24 border-4 border-card rounded-full" />
                <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize px-4 py-1.5 text-sm">
                {user.role}
              </Badge>
            </div>

            <div className="grid gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-primary" />
                  Personal Information
                </h3>
                <div className="grid gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                      <p className="font-medium">{user.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email Address
                      </p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Role & Permissions
                    </p>
                    <p className="font-medium capitalize">{user.role}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50">
                <Button 
                  variant="destructive" 
                  className="w-full sm:w-auto hover:bg-destructive/90" 
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PremiumLayout>
  );
}
