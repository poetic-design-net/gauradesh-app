import { Skeleton } from "@/components/ui/skeleton"

interface PageLoadingProps {
  items?: number
  showHeader?: boolean
}

export function PageLoading({ items = 3, showHeader = true }: PageLoadingProps) {
  return (
    <div className="content-fade-in space-y-6 p-6">
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="skeleton h-8 w-[250px] animate-shimmer" />
          <Skeleton className="skeleton h-4 w-[350px] animate-shimmer" />
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl">
            <Skeleton 
              className="skeleton h-[200px] transform transition-all duration-300 ease-in-out animate-shimmer" 
            />
          </div>
        ))}
      </div>
    </div>
  )
}
