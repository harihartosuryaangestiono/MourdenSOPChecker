"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRequireRole } from "@/hooks/useAuth";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { PremiumLoading } from "@/components/common/PremiumLoading";
import { EmptyState } from "@/components/common/EmptyState";
import { BarChart3, TrendingUp, Users, CheckCircle, Activity, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from "recharts";

const performanceData = [
  { name: 'Mon', score: 85, avg: 75 },
  { name: 'Tue', score: 88, avg: 75 },
  { name: 'Wed', score: 92, avg: 75 },
  { name: 'Thu', score: 86, avg: 75 },
  { name: 'Fri', score: 95, avg: 75 },
  { name: 'Sat', score: 98, avg: 75 },
  { name: 'Sun', score: 94, avg: 75 },
];

export default function OwnerAnalyticsPage() {
  const { allowed, isLoading } = useRequireRole("owner");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <PremiumLoading />
      </div>
    );
  }
  
  if (!allowed) return null;

  return (
    <PremiumLayout title="Analytics" subtitle="Deep dive into your cafe's performance">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">This Week</Button>
            <Button variant="ghost" size="sm">This Month</Button>
            <Button variant="ghost" size="sm">Last 30 Days</Button>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="card-premium col-span-2">
            <CardHeader>
              <CardTitle>Completion Trends</CardTitle>
              <CardDescription>Daily task completion rate vs average</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                    />
                    <Line type="monotone" strokeDasharray="5 5" dataKey="avg" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Staff with highest completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState 
                icon={Users} 
                title="Not enough data" 
                description="We need more activity to generate staff rankings." 
                actionLabel="View Staff"
                onAction={() => window.location.href = '/admin/staff'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PremiumLayout>
  );
}
