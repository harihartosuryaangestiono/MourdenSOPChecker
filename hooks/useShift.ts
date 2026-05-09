"use client";

import { useState, useEffect } from "react";
import { getCurrentShift, getShiftTimeRange, getShiftLabel } from "@/lib/utils";

type Shift = 'opening' | 'middle' | 'closing';

export function useShift() {
  const [shift, setShift] = useState<Shift>("opening");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setShift(getCurrentShift());
    
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setShift(getCurrentShift());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return {
    shift,
    label: getShiftLabel(shift),
    timeRange: getShiftTimeRange(shift),
    currentTime,
  };
}
