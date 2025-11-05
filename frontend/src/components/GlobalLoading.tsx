import { useLoading } from '../contexts/LoadingContext';
import { LoadingSpinner } from './LoadingSpinner';

export function GlobalLoading() {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) {
    return null;
  }

  return <LoadingSpinner message={loadingMessage} size="large" fullScreen />;
}
