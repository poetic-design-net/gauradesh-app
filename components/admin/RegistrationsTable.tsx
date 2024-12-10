import { EnrichedRegistration, ServiceRegistration } from '@/lib/db/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, CheckCircle2, XCircle, Clock, ChevronDown } from 'lucide-react';
import { ExpandableText } from './ExpandableText';
import { formatFirebaseTimestamp } from '@/lib/utils';

interface RegistrationsTableProps {
  registrations: EnrichedRegistration[];
  onStatusUpdate: (registrationId: string, newStatus: ServiceRegistration['status']) => void;
  onDeleteRegistration: (registrationId: string) => void;
  isLoading: boolean;
}

const getStatusConfig = (status: ServiceRegistration['status']) => {
  switch (status) {
    case 'approved':
      return {
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/10',
        hoverBgColor: 'hover:bg-green-100 dark:hover:bg-green-900/20',
        label: 'Approved'
      };
    case 'rejected':
      return {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/10',
        hoverBgColor: 'hover:bg-red-100 dark:hover:bg-red-900/20',
        label: 'Rejected'
      };
    default:
      return {
        icon: Clock,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
        hoverBgColor: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/20',
        label: 'Pending'
      };
  }
};

export function RegistrationsTable({ 
  registrations, 
  onStatusUpdate, 
  onDeleteRegistration, 
  isLoading 
}: RegistrationsTableProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>Registrations</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium w-full sm:w-auto">Service</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">User</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-sm font-medium">Status</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium">Message</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {registrations.map((reg) => {
                    const statusConfig = getStatusConfig(reg.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                    <tr key={reg.id} className="hover:bg-muted/50">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm w-full sm:w-auto">
                        <div className="font-medium break-words">
                          <ExpandableText text={reg.serviceName || ''} maxLength={30} />
                        </div>
                        <div className="sm:hidden mt-2 space-y-2.5 border-t border-border/50 pt-2">
                          <div className="flex items-center space-x-2">
                            <div className="min-w-[4rem] text-xs font-medium text-muted-foreground">User</div>
                            <div className="flex-1 break-words text-sm">{reg.user?.email}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="min-w-[4rem] text-xs font-medium text-muted-foreground">Date</div>
                            <div className="flex-1 text-sm">{formatFirebaseTimestamp(reg.createdAt)}</div>
                          </div>
                        </div>
                        {reg.message && (
                          <div className="sm:hidden mt-2.5 border-t border-border/50 pt-2.5">
                            <div className="text-xs font-medium text-muted-foreground mb-1.5">Message</div>
                            <div className="text-sm italic text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                              <ExpandableText text={reg.message} maxLength={200} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm break-words">{reg.user?.email}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm">
                        <div className="relative group">
                          <select
                            value={reg.status}
                            onChange={(e) => onStatusUpdate(reg.id, e.target.value as ServiceRegistration['status'])}
                            className={`
                              w-full
                              rounded-lg
                              transition-colors duration-200
                              cursor-pointer
                              focus:ring-2
                              focus:ring-offset-2
                              appearance-none
                              relative
                              z-10
                              opacity-0
                              py-2 px-3
                            `}
                            disabled={isLoading}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <div className={`
                            absolute top-0 left-0 right-0 bottom-0
                            flex items-center
                            pointer-events-none
                            ${statusConfig.bgColor}
                            ${statusConfig.hoverBgColor}
                            rounded-lg
                            px-3
                            border border-border/50
                            shadow-sm
                            transition-all duration-200
                            group-hover:shadow
                          `}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                                <span className="text-sm hidden md:block font-medium">{statusConfig.label}</span>
                              </div>
                              <ChevronDown className="w-4 h-4 hidden sm:block opacity-50" />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm">
                        {formatFirebaseTimestamp(reg.createdAt)}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm break-words">
                        {reg.message ? (
                          <div className="italic text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                            <ExpandableText text={reg.message} maxLength={50} />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No message</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeleteRegistration(reg.id)}
                          disabled={isLoading}
                          className="ml-auto"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
