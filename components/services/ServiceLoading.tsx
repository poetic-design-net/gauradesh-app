'use client';

export function ServiceLoading() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="space-y-4 pt-8 px-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-6 w-96 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-[200px] bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Weekly View Skeleton */}
      <div className="space-y-8 p-6">
        {[...Array(2)].map((_, weekIndex) => (
          <div key={weekIndex} className="space-y-4">
            {/* Week Header */}
            <div className="h-6 w-64 bg-white/10 rounded animate-pulse" />
            
            {/* Services List */}
            <div className="space-y-4">
              {[...Array(3)].map((_, serviceIndex) => (
                <div 
                  key={serviceIndex}
                  className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-grow">
                      {/* Icon */}
                      <div className="h-9 w-9 rounded-full bg-white/10 animate-pulse" />
                      
                      {/* Title and Type */}
                      <div className="flex-grow space-y-2">
                        <div className="h-5 w-48 bg-white/10 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                      </div>
                      
                      {/* Time */}
                      <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                      
                      {/* Register Button */}
                      <div className="ml-4 h-9 w-24 bg-white/10 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
