"use client";

import { PremiumLayout } from "@/components/layout/PremiumLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, TrendingUp, Calendar, ArrowRight, Activity, Filter, Clock } from "lucide-react";
import { motion, Variants } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ReportsPage() {
  return (
    <PremiumLayout 
      title="Reports & Analytics" 
      subtitle="Generate and download detailed operational reports"
    >
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 bg-card">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>This Month</span>
            </Button>
            <Button variant="outline" size="icon" className="bg-card">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          <Button className="gap-2 shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary to-primary-600">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <motion.div variants={itemVariants}>
            <Card className="card-premium relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-md">
                    <TrendingUp className="w-3 h-3 mr-1" /> +12%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">87%</h3>
                <p className="text-sm font-medium text-muted-foreground">Overall Completion</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-premium relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-secondary/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-secondary rounded-xl text-foreground">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">342</h3>
                <p className="text-sm font-medium text-muted-foreground">Tasks Generated</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-premium relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-warning/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-warning/10 rounded-xl text-warning">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-md">
                    <TrendingUp className="w-3 h-3 mr-1" /> Faster
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">18<span className="text-lg font-medium text-muted-foreground">m</span></h3>
                <p className="text-sm font-medium text-muted-foreground">Avg Completion Time</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="card-premium border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>Download detailed historical data for offline analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: "Monthly Operations Summary", desc: "Aggregated SOP completion data for the current month.", date: "Nov 2023" },
                  { title: "Staff Performance Matrix", desc: "Individual completion rates and submission times.", date: "Q4 2023" },
                  { title: "Incident & Overdue Log", desc: "Detailed list of all missed or late tasks.", date: "Last 30 Days" }
                ].map((report, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-background rounded-lg border border-border shadow-sm">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{report.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{report.desc}</p>
                        <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 bg-background border border-border rounded-full text-muted-foreground">
                          {report.date}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full sm:w-auto hover:bg-primary/10 hover:text-primary transition-colors">
                      Generate <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </PremiumLayout>
  );
}
