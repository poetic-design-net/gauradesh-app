export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 h-48" />

      {/* Action Buttons Skeleton */}
      <div className="flex justify-end space-x-4">
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg bg-gray-200 dark:bg-gray-800 h-32" />
        ))}
      </div>

      {/* Services List Skeleton */}
      <div className="rounded-lg bg-gray-200 dark:bg-gray-800">
        <div className="h-16 border-b border-gray-300 dark:border-gray-700" />
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
