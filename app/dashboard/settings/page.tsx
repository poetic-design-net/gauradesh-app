'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Moon, Sun } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleNotificationChange = (checked: boolean) => {
    setEmailNotifications(checked);
    toast({
      title: 'Settings updated',
      description: `Email notifications ${checked ? 'enabled' : 'disabled'}`,
    });
  };

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
    toast({
      title: 'Theme updated',
      description: `Dark mode ${checked ? 'enabled' : 'disabled'}`,
    });
  };

  return (
    <div className="space-y-6">
      <h1>Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Bell className="h-5 w-5" />
              <Label htmlFor="email-notifications">Email Notifications</Label>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={handleNotificationChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <Label htmlFor="dark-mode">Dark Mode</Label>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={handleThemeChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connected Email: {user?.email}
          </p>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}