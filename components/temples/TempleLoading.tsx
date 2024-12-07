import { Skeleton } from "@/components/ui/skeleton"

export function TempleLoading() {
  return (
    <div className="container mx-auto p-6 space-y-8 no-fouc">
      <div className="skeleton animate-shimmer w-full aspect-video rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="skeleton animate-shimmer h-8 w-[300px]" />
        <Skeleton className="skeleton animate-shimmer h-4 w-[200px]" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="skeleton animate-shimmer h-[200px] w-full rounded-lg" />
          <Skeleton className="skeleton animate-shimmer h-4 w-3/4" />
          <Skeleton className="skeleton animate-shimmer h-4 w-1/2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="skeleton animate-shimmer h-[200px] w-full rounded-lg" />
          <Skeleton className="skeleton animate-shimmer h-4 w-2/3" />
          <Skeleton className="skeleton animate-shimmer h-4 w-1/2" />
        </div>
      </div>
    </div>
  )
}
