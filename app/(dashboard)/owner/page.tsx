"use client";

import { useRequireRole } from "@/hooks/useAuth";
import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, Variants } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Calendar,
  Coffee,
  Star
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

const weeklyData = [
  { name: "Sen", completion: 85, target: 90 },
  { name: "Sel", completion: 92, target: 90 },
  { name: "Rab", completion: 78, target: 90 },
  { name: "Kam", completion: 95, target: 90 },
  { name: "Jum", completion: 88, target: 90 },
  { name: "Sab", completion: 90, target: 90 },
  { name: "Min", completion: 82, target: 90 },
];

const staffPerformance = [
  { id: 1, name: "Budi Santoso", role: "Barista", score: 98, tasksCompleted: 45, status: "Excellent" },
  { id: 2, name: "Siti Aminah", role: "Cashier", score: 95, tasksCompleted: 42, status: "Excellent" },
  { id: 3, name: "Agus Pratama", role: "Server", score: 88, tasksCompleted: 38, status: "Good" },
  { id: 4, name: "Dewi Lestari", role: "Kitchen", score: 82, tasksCompleted: 35, status: "Needs Improvement" },
];

const recentActivity = [
  { id: 1, user: "Budi Santoso", action: "Completed Opening Checklist", time: "10 mins ago", type: "success" },
  { id: 2, user: "Siti Aminah", action: "Uploaded Cash Register Photo", time: "25 mins ago", type: "info" },
  { id: 3, user: "System", action: "Kitchen Cleaning Overdue", time: "1 hour ago", type: "warning" },
  { id: 4, user: "Agus Pratama", action: "Completed Closing Shift", time: "Yesterday", type: "success" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

import { PremiumLoading } from "@/components/common/PremiumLoading";

export default function OwnerDashboard() {
  const { allowed, isLoading } = useRequireRole("owner");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading Owner Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return null; // The hook will redirect
  }

  return (
    <PremiumLayout 
      title="Owner Dashboard" 
      subtitle="Comprehensive view of your cafe operations"
    >
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVariants}>
            <Card className="card-premium relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Overall Completion</p>
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <TargetIcon className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">87%</div>
                  <span className="flex items-center text-xs font-medium text-success">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +2.5%
                  </span>
                </div>
                <Progress value={87} className="h-2 mt-4" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-premium relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">12</div>
                  <span className="flex items-center text-xs font-medium text-muted-foreground">
                    Online Now: 4
                  </span>
                </div>
                <div className="mt-4 flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-medium">
                      U{i}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-premium relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-500">24</div>
                  <span className="flex items-center text-xs font-medium text-success">
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                    -12%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">15 require photo proof</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-premium relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Overdue Tasks</p>
                  <div className="p-2 bg-destructive/10 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-destructive">3</div>
                  <span className="flex items-center text-xs font-medium text-destructive">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +1
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4 h-8 text-xs text-destructive hover:bg-destructive hover:text-white border-destructive/20">
                  Review Overdue
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-7">
          <motion.div variants={itemVariants} className="md:col-span-4">
            <Card className="card-premium h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Completion Trend</CardTitle>
                    <CardDescription>7-day operational completion rate</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">This Week</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
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
                      <Line 
                        type="monotone" 
                        dataKey="expected" 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeDasharray="5 5"
                        strokeWidth={2} 
                        dot={false} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="completion" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCompletion)" 
                      />
                      <Line type="monotone" strokeDasharray="5 5" dataKey="target" stroke="hsl(var(--muted-foreground))" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-3">
            <Card className="card-premium h-full">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Real-time operational updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentActivity.map((activity, i) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="relative mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-success' : 
                          activity.type === 'warning' ? 'bg-warning' : 'bg-blue-500'
                        }`} />
                        {i !== recentActivity.length - 1 && (
                          <div className="absolute top-3 left-[3px] w-[2px] h-8 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{activity.action}</p>
                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                          <span className="font-medium text-foreground">{activity.user}</span>
                          <span>•</span>
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-6 text-primary hover:text-primary/80">
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Staff Performance */}
        <motion.div variants={itemVariants}>
          <Card className="card-premium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  <CardTitle>Staff Performance</CardTitle>
                </div>
                <Button variant="outline" size="sm">View All Staff</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 rounded-lg">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Staff Member</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Completion Score</th>
                      <th className="px-4 py-3">Tasks Completed</th>
                      <th className="px-4 py-3 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPerformance.map((staff) => (
                      <tr key={staff.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-4 font-medium flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {staff.name.charAt(0)}
                          </div>
                          {staff.name}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{staff.role}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Progress value={staff.score} className="w-24 h-2" />
                            <span className="font-medium">{staff.score}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium">{staff.tasksCompleted}</td>
                        <td className="px-4 py-4">
                          <Badge variant="secondary" className={`
                            ${staff.status === 'Excellent' ? 'bg-success/10 text-success border-success/20' : 
                              staff.status === 'Good' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                              'bg-warning/10 text-warning border-warning/20'}
                          `}>
                            {staff.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PremiumLayout>
  );
}

function TargetIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
