import React, { useEffect, useCallback } from 'react';

// Performance monitoring utilities
export const usePerformanceMonitoring = () => {
  // Monitor component render performance
  const measureRenderTime = useCallback((componentName: string, renderFn: () => void) => {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${endTime - startTime}ms`);
    }
  }, []);

  // Monitor bundle loading performance
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Report initial load performance in development
      console.log('Performance monitoring active in development mode');
    }
  }, []);

  // Memory usage monitoring (simplified for browser compatibility)
  const monitorMemoryUsage = useCallback(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      console.log('Memory Usage:', {
        used: `${Math.round(memInfo.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(memInfo.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(memInfo.jsHeapSizeLimit / 1048576)} MB`
      });
    }
  }, []);

  return {
    measureRenderTime,
    monitorMemoryUsage
  };
};

// Component performance wrapper
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const { measureRenderTime } = usePerformanceMonitoring();
    
    useEffect(() => {
      measureRenderTime(componentName, () => {
        // Component rendered
      });
    });

    return React.createElement(Component, props);
  });
};
