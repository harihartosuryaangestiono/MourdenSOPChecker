"use client";

import { create } from "zustand";
import type { Notification, Activity, Shift } from "@/types";

interface AppState {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  
  // Active shift
  activeShift: Shift;
  setActiveShift: (shift: Shift) => void;
  
  // Tasks
  refreshTasks: () => void;
  lastRefreshed: number;
  
  // Activity feed
  activities: Activity[];
  addActivity: (activity: Record<string, unknown>) => void;
  
  // UI State
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Notifications
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },
  
  // Active shift
  activeShift: "opening",
  setActiveShift: (shift) => set({ activeShift: shift }),
  
  // Tasks
  lastRefreshed: Date.now(),
  refreshTasks: () => set({ lastRefreshed: Date.now() }),
  
  // Activity feed
  activities: [],
  addActivity: (payload) => {
    // Transform the payload into an Activity format
    const activity: Activity = {
      id: (payload.id as string) || crypto.randomUUID(),
      user_id: (payload.submitted_by as string) || "",
      user_name: "Staff Member",
      action: "menyelesaikan",
      task_title: "Task",
      created_at: (payload.submitted_at as string) || new Date().toISOString(),
    };
    
    set((state) => ({
      activities: [activity, ...state.activities].slice(0, 20),
    }));
  },
  
  // UI State
  isOffline: false,
  setIsOffline: (offline) => set({ isOffline: offline }),
}));
