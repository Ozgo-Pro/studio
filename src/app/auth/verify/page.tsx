'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  const handleGoToLogin = () => {
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>Please Verify Your Email</CardTitle>
          <CardDescription>
            We have sent you a verification email to{' '}
            <span className="font-semibold text-foreground">{email}</span>. Please
            verify it and log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoToLogin} className="w-full">
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
