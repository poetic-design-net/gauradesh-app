import { Skeleton } from "@/components/ui/skeleton"

interface PageLoadingProps {
  items?: number
  showHeader?: boolean
}

export function PageLoading({ items = 3, showHeader = true }: PageLoadingProps) {
  return (
    <div className="loading-enter space-y-6 p-6">
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: items }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="h-[200px] rounded-xl transition-all duration-200 ease-in-out" 
          />
        ))}
      </div>
    </div>
  )
}
