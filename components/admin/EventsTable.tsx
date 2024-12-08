import { Event } from '@/lib/db/events/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { ExpandableText } from './ExpandableText';

interface EventsTableProps {
  events: Event[];
  onDeleteEvent: (event: Event) => void;
  isLoading: boolean;
}

export function EventsTable({ events, onDeleteEvent, isLoading }: EventsTableProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>Events</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6">
        <div className="overflow-x-auto sm:-mx-4">
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
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-muted/50">
                      <td className="px-2 sm:px-4 py-3 text-sm">
                        <div className="font-medium">
                          <ExpandableText text={event.title} />
                        </div>
                        <div className="sm:hidden text-xs text-muted-foreground mt-1 space-y-1">
                          <div>{event.location}</div>
                          <div>{event.startDate.toDate().toLocaleString()}</div>
                          <div>{event.endDate.toDate().toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm">{event.location}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm">
                        {event.startDate.toDate().toLocaleString()}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm">
                        {event.endDate.toDate().toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeleteEvent(event)}
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
