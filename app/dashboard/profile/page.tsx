'use client';

import { UserProfileForm } from '@/components/dashboard/UserProfileForm';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile Settings</h1>
      <UserProfileForm />
    </div>
  );
}