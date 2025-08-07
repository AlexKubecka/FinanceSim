import { lazy, Suspense } from 'react';

// Lazy load major route components
export const LazyLifeSimulator = lazy(() => 
  import('../pages/LifeSimulator').then(module => ({ default: module.LifeSimulator }))
);

export const LazyInvestmentSimulator = lazy(() => 
  import('../pages/InvestmentSimulator').then(module => ({ default: module.InvestmentSimulator }))
);

// Loading component for Suspense fallback
export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-lg text-gray-600">Loading...</span>
  </div>
);

// HOC for lazy loading with Suspense
export const withLazyLoading = (LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>) => {
  return (props: any) => (
    <Suspense fallback={<PageLoader />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};
