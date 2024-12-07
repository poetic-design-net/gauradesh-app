import { PageLoading } from "@/components/ui/page-loading"

export default function DashboardLoading() {
  return (
    <div className="no-fouc">
      <PageLoading items={3} showHeader={true} />
    </div>
  )
}
