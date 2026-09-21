import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-ceramic p-4 flex flex-col space-y-4 shadow-soft animate-pulse"
        >
          <div className="w-full h-48 rounded-xl bg-ceramic/70" />
          <div className="space-y-2">
            <div className="h-4 bg-ceramic/70 rounded w-3/4" />
            <div className="h-3 bg-ceramic/50 rounded w-full" />
            <div className="h-3 bg-ceramic/50 rounded w-2/3" />
          </div>
          <div className="pt-3 border-t border-ceramic flex items-center justify-between">
            <div className="h-5 bg-ceramic/70 rounded w-24" />
            <div className="h-8 bg-ceramic/70 rounded-pill w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
