'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getDashboardPath } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace('/auth/login');
    } else {
      router.replace(getDashboardPath(user.role));
    }
  }, [router]);
  return null;
}
