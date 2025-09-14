
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a simulated progress tracker for file uploads
 * @param onProgress Callback function that receives progress updates (0-100)
 * @returns Function to call when upload completes to set progress to 100%
 */
export function createUploadProgressTracker(onProgress: (progress: number) => void) {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    onProgress(Math.min(progress, 95)); // Cap at 95% until actual completion
    if (progress >= 95) clearInterval(interval);
  }, 300);
  
  return () => {
    clearInterval(interval);
    onProgress(100); // Set to 100% when done
  };
}
