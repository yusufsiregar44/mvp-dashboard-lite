import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LoadingErrorWrapperProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: ReactNode;
}

export function LoadingErrorWrapper({ loading, error, onRetry, children }: LoadingErrorWrapperProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="font-semibold">Error Loading Data</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              {onRetry && (
                <Button onClick={onRetry} variant="outline">
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

