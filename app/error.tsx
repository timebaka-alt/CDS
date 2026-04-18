'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <button
          className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => reset()}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
