"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  timestamp?: string;
  uploaderName?: string;
}

export function ImageViewerModal({ isOpen, onClose, imageUrl, title, timestamp, uploaderName }: ImageViewerModalProps) {
  const [scale, setScale] = useState(1);

  const handleClose = () => {
    setScale(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col gap-0.5">
                {title && <p className="text-sm font-semibold text-white">{title}</p>}
                {(uploaderName || timestamp) && (
                  <p className="text-xs text-white/50">
                    {uploaderName}{uploaderName && timestamp ? " · " : ""}{timestamp}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <a
                  href={imageUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl bg-black/40 border border-white/10">
              <img
                src={imageUrl}
                alt={title ?? "Photo proof"}
                className="w-full object-contain max-h-[80vh] transition-transform duration-200"
                style={{ transform: "scale(" + scale + ")" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
