import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Shift management functions
export function getCurrentShift(): 'opening' | 'closing' {
  const hour = new Date().getHours()
  
  if (hour >= 9 && hour < 16) return 'opening'
  return 'closing'
}

export function getShiftLabel(shift: string): string {
  switch (shift) {
    case 'opening': return 'Opening Shift'
    case 'closing': return 'Closing Shift'
    default: return shift
  }
}

export function getShiftTimeRange(shift: string): string {
  switch (shift) {
    case 'opening': return '09:00 - 16:00'
    case 'closing': return '16:00 - 22:00'
    default: return '09:00 - 22:00'
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatTime(date: Date | string): string {
  if (!date) return "";
  
  if (typeof date === 'string') {
    // Extract HH:MM from strings like "08:00:00" or "08:00" or with timezone
    const match = date.match(/(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date";
  
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue" | "rejected" | "approved" | "submitted" | "revision_requested";

export const STATUS_COLORS: Record<TaskStatus, { bg: string, text: string, border: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" },
  in_progress: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  completed: { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-500/20" },
  overdue: { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-500/20" },
  rejected: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/20" },
  approved: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  submitted: { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500/20" },
  revision_requested: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/20" }
};

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "File must be an image" };
  }
  
  // Max size 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "Image size must be less than 5MB" };
  }
  
  return { valid: true };
}

export async function compressImage(file: File, options?: { maxWidth?: number; quality?: number }): Promise<File> {
  // In a real application, you might want to use a library like browser-image-compression
  // For now, we'll return the file as is, but this serves as a placeholder for actual compression logic
  return file;
}
