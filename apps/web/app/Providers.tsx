'use client';

import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json'; // ← パスはあとで合わせる
import { useEffect } from 'react';

let configured = false;

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!configured) {
      Amplify.configure(outputs);
      configured = true;
    }
  }, []);

  return <>{children}</>;
}
