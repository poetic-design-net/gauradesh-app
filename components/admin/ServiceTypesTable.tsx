import { ServiceType } from '@/lib/db/services/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, Pencil } from 'lucide-react';
import { ExpandableText } from './ExpandableText';
import { icons } from 'lucide-react';

interface ServiceTypesTableProps {
  serviceTypes: ServiceType[];
  onDeleteServiceType: (serviceType: ServiceType) => void;
  onEditServiceType?: (serviceType: ServiceType) => void;
  isLoading: boolean;
}

export function ServiceTypesTable({ 
  serviceTypes, 
  onDeleteServiceType, 
  onEditServiceType, 
  isLoading 
}: ServiceTypesTableProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>Service Types</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Icon</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {serviceTypes.map((serviceType) => {
                    const Icon = icons[serviceType.icon as keyof typeof icons];
                    return (
                      <tr key={serviceType.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">
                          {Icon && <Icon className="h-5 w-5" />}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">
                            <ExpandableText text={serviceType.name} />
                          </div>
                          {serviceType.description && (
                            <div className="sm:hidden text-xs text-muted-foreground mt-1">
                              <ExpandableText text={serviceType.description} />
                            </div>
                          )}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-sm">
                          {serviceType.description && (
                            <ExpandableText text={serviceType.description} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {onEditServiceType && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEditServiceType(serviceType)}
                                disabled={isLoading}
                                className="hover:bg-muted"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onDeleteServiceType(serviceType)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
