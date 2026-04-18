'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
