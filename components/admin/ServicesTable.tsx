import { Service } from '@/lib/db/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, Pencil } from 'lucide-react';
import { ExpandableText } from './ExpandableText';
import { formatFirebaseTimestamp } from '@/lib/utils';

interface ServicesTableProps {
  services: Service[];
  onDeleteService: (service: Service) => void;
  onEditService?: (service: Service) => void;
  isLoading: boolean;
}

export function ServicesTable({ 
  services, 
  onDeleteService, 
  onEditService, 
  isLoading 
}: ServicesTableProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>Services</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Participants</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-muted/50">
                      <td className="px-2 sm:px-4 py-3 text-sm">
                        <div className="font-medium">
                          <ExpandableText text={service.name} />
                        </div>
                        <div className="sm:hidden text-xs text-muted-foreground mt-1 space-y-1">
                          <div>{service.type}</div>
                          <div>{formatFirebaseTimestamp(service.date)}</div>
                          <div>{service.timeSlot.start} - {service.timeSlot.end}</div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm">
                        <Badge variant="outline">{service.type}</Badge>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm">
                        {formatFirebaseTimestamp(service.date)}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm">
                        {service.timeSlot.start} - {service.timeSlot.end}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="secondary">
                          {service.currentParticipants}/{service.maxParticipants}
                        </Badge>
                        {service.pendingParticipants > 0 && (
                          <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                            {service.pendingParticipants} pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {onEditService && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditService(service)}
                              disabled={isLoading}
                              className="hover:bg-muted"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteService(service)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
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
  );
}
