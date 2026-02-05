'use client';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const instances = initializeFirebase();
  return <FirebaseProvider value={instances}>{children}</FirebaseProvider>;
}
