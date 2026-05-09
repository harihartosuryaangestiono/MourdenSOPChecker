"use client";

import { useEffect, useState } from "react";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/common/UserAvatar";
import { getStaffMembers } from "@/services/user.service";
import type { User } from "@/types/auth.types";
import { Plus, Mail, Search, Filter, MoreVertical, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import { PremiumLoading } from "@/components/common/PremiumLoading";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    try {
      setLoading(true);
      const data = await getStaffMembers();
      setStaff(data);
    } catch (error) {
      console.error("Failed to load staff", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <PremiumLoading />
      </div>
    );
  }

  return (
    <PremiumLayout 
      title="Staff Management" 
      subtitle="Manage your cafe team, roles, and access"
    >
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search staff by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full max-w-md bg-card border-border focus-visible:ring-primary/20"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button className="w-full sm:w-auto gap-2 shadow-md">
              <Plus className="w-4 h-4" /> Add Staff
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="card-premium animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredStaff.map((member) => (
                <motion.div key={member.id} variants={itemVariants} layout>
                  <Card className="card-premium group hover:border-primary/30 transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar 
                            name={member.name} 
                            avatarUrl={member.avatar_url} 
                            className="h-12 w-12 border-2 border-primary/10 group-hover:border-primary/30 transition-colors" 
                          />
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {member.name}
                            </h3>
                            <Badge variant="outline" className="text-[10px] mt-1 capitalize bg-secondary/50">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="gap-2"><Edit2 className="w-4 h-4" /> Edit Profile</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-4 h-4" /> Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <span className="text-xs font-medium text-muted-foreground">Status</span>
                          <div className={cn(
                            "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md",
                            member.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          )}>
                            {member.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {member.is_active ? "Active" : "Inactive"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredStaff.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/30 rounded-xl border border-dashed border-border">
                <p>No staff members found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </PremiumLayout>
  );
}
