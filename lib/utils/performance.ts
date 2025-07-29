// Performance utilities for SkyBox
// These utilities help optimize performance and load speed

import { useEffect, useRef, useState, useCallback } from "react";

// Lazy loading hook for components
export const useLazyLoad = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { elementRef, isVisible };
};

// Image optimization utilities
export const optimizeImage = (url: string, width?: number, quality = 80) => {
  if (!url) return url;

  // If it's already an optimized URL, return as is
  if (url.includes("?") || url.includes("&")) return url;

  const params = new URLSearchParams();
  if (width) params.append("w", width.toString());
  params.append("q", quality.toString());
  params.append("auto", "format");
  params.append("fit", "max");

  return `${url}?${params.toString()}`;
};

// Debounce hook for search and other frequent operations
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for scroll and resize events
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;
};

// Virtual scrolling utilities
export const useVirtualScroll = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemCount + 1, itemCount);

  const visibleItems = Array.from(
    { length: endIndex - startIndex },
    (_, index) => startIndex + index
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
};

// Memory management utilities
export const useMemoryOptimization = () => {
  const cleanupRefs = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupRefs.current.push(cleanup);
  }, []);

  useEffect(() => {
    return () => {
      cleanupRefs.current.forEach((cleanup) => cleanup());
      cleanupRefs.current = [];
    };
  }, []);

  return { addCleanup };
};

// Preload utilities
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = async (srcs: string[]): Promise<void> => {
  const promises = srcs.map((src) => preloadImage(src));
  await Promise.all(promises);
};

// Bundle splitting utilities
export const loadComponent = (importFunc: () => Promise<any>) => {
  return React.lazy(importFunc);
};

// Cache utilities
export const createCache = <T>(maxSize = 100) => {
  const cache = new Map<string, T>();

  return {
    get: (key: string): T | undefined => cache.get(key),
    set: (key: string, value: T): void => {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    has: (key: string): boolean => cache.has(key),
    clear: (): void => cache.clear(),
  };
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start}ms`);
};

// Resource hints for better performance
export const addResourceHints = () => {
  const hints = [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    { rel: "dns-prefetch", href: "https://api.appwrite.io" },
  ];

  hints.forEach(({ rel, href, crossOrigin }) => {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    document.head.appendChild(link);
  });
};

// Service Worker utilities for offline support
export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }
};

// Web Vitals monitoring
export const reportWebVitals = (metric: any) => {
  // Send to analytics service
  console.log("Web Vitals:", metric);
};

// Export all utilities
export const performanceUtils = {
  useLazyLoad,
  optimizeImage,
  useDebounce,
  useThrottle,
  useVirtualScroll,
  useMemoryOptimization,
  preloadImage,
  preloadImages,
  loadComponent,
  createCache,
  measurePerformance,
  addResourceHints,
  registerServiceWorker,
  reportWebVitals,
};
