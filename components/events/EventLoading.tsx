import { Skeleton } from "@/components/ui/skeleton"

export function EventLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6 no-fouc">
      <div className="rounded-lg border bg-card">
        {/* Header */}
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-2/3 skeleton animate-shimmer" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-24 skeleton animate-shimmer" />
            <Skeleton className="h-4 w-24 skeleton animate-shimmer" />
          </div>
        </div>

        {/* Image */}
        <div className="px-6">
          <Skeleton className="w-full h-64 rounded-lg skeleton animate-shimmer" />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column - Details */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded-full skeleton animate-shimmer" />
                  <Skeleton className="h-4 w-32 skeleton animate-shimmer" />
                </div>
              ))}
            </div>

            {/* Right Column - Description */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 skeleton animate-shimmer" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full skeleton animate-shimmer" />
                <Skeleton className="h-4 w-5/6 skeleton animate-shimmer" />
                <Skeleton className="h-4 w-4/6 skeleton animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Register Button */}
          <div className="mt-6">
            <Skeleton className="h-10 w-32 rounded-md skeleton animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}
