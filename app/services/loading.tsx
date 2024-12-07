export default function ServicesLoading() {
  return (
    <div className="relative container mx-auto p-6 space-y-8 min-h-screen opacity-0 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="space-y-4 pt-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-10 w-64 bg-white/10 rounded animate-pulse" />
            <div className="h-6 w-96 bg-white/10 rounded mt-2 animate-pulse" />
          </div>
          <div className="w-[200px] h-10 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="backdrop-blur-lg bg-white/10 rounded-lg border border-white/20 overflow-hidden"
          >
            <div className="h-48 bg-white/5 animate-pulse" />
            <div className="p-6 space-y-4">
              <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
