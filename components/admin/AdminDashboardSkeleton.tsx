import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

export function AdminDashboardSkeleton() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button disabled variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button disabled className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Service Type
          </Button>
          <Button disabled className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
          <Button disabled className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden rounded-lg border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Location</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Start Date</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">End Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="sm:hidden mt-1">
                            <Skeleton className="h-3 w-[150px] mt-1" />
                            <Skeleton className="h-3 w-[120px] mt-1" />
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <Skeleton className="h-4 w-[150px]" />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <Skeleton className="h-4 w-[120px]" />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <Skeleton className="h-4 w-[120px]" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-8 w-[40px] ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden rounded-lg border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Type</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Registrations</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-[200px]" />
                          <div className="sm:hidden mt-1">
                            <Skeleton className="h-3 w-[150px] mt-1" />
                            <Skeleton className="h-3 w-[100px] mt-1" />
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <Skeleton className="h-4 w-[150px]" />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <Skeleton className="h-4 w-[100px]" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-8 w-[40px] ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Registrations</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden rounded-lg border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Service</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-[150px]" />
                              <Skeleton className="h-3 w-[120px] mt-1" />
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <Skeleton className="h-4 w-[200px]" />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <Skeleton className="h-6 w-[100px] rounded-full" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <Skeleton className="h-8 w-[100px]" />
                            <Skeleton className="h-8 w-[40px]" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
