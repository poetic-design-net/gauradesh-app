import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Temple, updateTempleNews } from '@/lib/db/temples';
import { Timestamp } from 'firebase/firestore';

interface NewsFormProps {
  temple: Temple;
  onSuccess: () => void;
}

export function NewsForm({ temple, onSuccess }: NewsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(temple.news?.title || '');
  const [content, setContent] = useState(temple.news?.content || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateTempleNews(temple.id, {
        title,
        content,
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days from now
      });

      toast({
        description: 'Temple news updated successfully'
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating temple news:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to update temple news'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temple News</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter news title"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              Content
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter news content"
              required
              className="min-h-[150px]"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update News'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
