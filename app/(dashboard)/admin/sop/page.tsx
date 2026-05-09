"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSOPTemplates } from "@/services/task.service";
import type { SOPTemplate } from "@/types/task.types";
import { Plus, Edit2, Search, Filter, Clock, MoreVertical, Trash2, CheckCircle2, Copy } from "lucide-react";
import Link from "next/link";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { PremiumLoading, SkeletonCard } from "@/components/common/PremiumLoading";
import { EmptyState } from "@/components/common/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { formatTime } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function SOPPage() {
  const [templates, setTemplates] = useState<SOPTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const data = await getSOPTemplates();
      setTemplates(data);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <PremiumLoading />
      </div>
    );
  }

  return (
    <PremiumLayout title="SOP Templates" subtitle="Manage standard operating procedures for your staff">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search SOP templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Button className="shrink-0 gap-2">
            <Plus className="w-4 h-4" /> Create SOP
          </Button>
        </div>

        <AnimatePresence>
          {filteredTemplates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <EmptyState 
                icon={Copy}
                title="No templates found"
                description={searchQuery ? "No templates match your search." : "Create your first SOP template to standardise your cafe operations."}
                actionLabel={searchQuery ? "Clear Search" : "Create Template"}
                onAction={() => searchQuery ? setSearchQuery("") : null} // In a real app, open create modal
              />
            </motion.div>
          ) : (
            <motion.div 
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredTemplates.map((template) => (
                <motion.div 
                  key={template.id} 
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
                  }}
                >
                  <Card className="card-premium h-full flex flex-col group">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
                            {template.shift} Shift
                          </Badge>
                          {template.is_active && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              Active
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {template.title}
                        </CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Edit2 className="w-4 h-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Copy className="w-4 h-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {template.description || "No description provided."}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto pt-4 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          Due: {template.deadline_time ? formatTime(template.deadline_time) : "Not set"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          {typeof template.task_count === 'number' ? template.task_count : 
                           (Array.isArray(template.task_count) ? (template.task_count as any[])[0]?.count || 0 : 
                            (template.task_count as any)?.count || 0)} tasks
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PremiumLayout>
  );
}
