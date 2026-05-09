"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Download, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
            <div className="flex flex-col text-white">
              {title && <h3 className="font-bold text-lg">{title}</h3>}
              <div className="flex items-center gap-4 text-xs text-white/70">
                {uploaderName && (
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {uploaderName}</span>
                )}
                {timestamp && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timestamp}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setScale(s => Math.min(s + 0.5, 3))}>
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setScale(s => Math.max(s - 0.5, 0.5))}>
                <ZoomOut className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => {
                const a = document.createElement('a');
                a.href = imageUrl;
                a.download = 'proof-image.jpg';
                a.click();
              }}>
                <Download className="w-5 h-5" />
              </Button>
              <div className="w-px h-6 bg-white/20 mx-2" />
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-red-400" onClick={onClose}>
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div 
            className="relative w-full h-full flex items-center justify-center overflow-hidden p-12"
            onClick={onClose}
          >
            <motion.div
              animate={{ scale }}
              className="relative max-w-5xl w-full max-h-[80vh] flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={imageUrl} 
                alt={title || "Proof"} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black" 
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
