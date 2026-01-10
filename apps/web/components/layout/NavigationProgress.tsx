"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset on route change complete
    setIsNavigating(false);
    setProgress(100);
    
    const timeout = setTimeout(() => {
      setProgress(0);
    }, 200);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor) {
        const href = anchor.getAttribute("href");
        const isExternal = anchor.target === "_blank" || anchor.rel?.includes("external");
        const isSamePageAnchor = href?.startsWith("#");
        const isCurrentPage = href === pathname;
        
        // Only show loading for internal navigation to different pages
        if (href && !isExternal && !isSamePageAnchor && !isCurrentPage && href.startsWith("/")) {
          setIsNavigating(true);
          setProgress(0);
          
          // Animate progress
          let currentProgress = 0;
          progressInterval = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress > 90) {
              currentProgress = 90;
              clearInterval(progressInterval);
            }
            setProgress(currentProgress);
          }, 100);
        }
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [pathname]);

  if (!isNavigating && progress === 0) return null;

  return (
    <>
      {/* Progress bar at top */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 transition-all duration-200 ease-out shadow-lg shadow-primary/50"
          style={{
            width: `${progress}%`,
            opacity: progress === 100 ? 0 : 1,
          }}
        />
      </div>
      
      {/* Subtle overlay during navigation */}
      {isNavigating && (
        <div className="fixed inset-0 z-[99] bg-white/30 backdrop-blur-[1px] pointer-events-none transition-opacity duration-200" />
      )}
    </>
  );
}

