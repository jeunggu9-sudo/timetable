# Error Handling and Loading State Guide

## Error Handling

### Basic Usage

```typescript
import { showError, showSuccess, showWarning } from '../utils/errorHandler';

// Show error
try {
  await someApiCall();
} catch (error) {
  showError(error, 'Failed to load data');
}

// Show success message
showSuccess('Data saved successfully!');

// Show warning
showWarning('This action cannot be undone');
```

### With Error Handling Wrapper

```typescript
import { withErrorHandling } from '../utils/errorHandler';

const result = await withErrorHandling(
  async () => {
    return await apiCall();
  },
  'Loading data'
);

if (result) {
  // Handle success
}
```

### With Loading State

```typescript
import { withLoadingAndError } from '../utils/errorHandler';

const [loading, setLoading] = useState(false);

const result = await withLoadingAndError(
  async () => {
    return await apiCall();
  },
  setLoading,
  'Loading data'
);
```

## Loading State

### Using Loading Context (Global)

```typescript
import { useLoading } from '../contexts/LoadingContext';

function MyComponent() {
  const { startLoading, stopLoading } = useLoading();

  const handleAction = async () => {
    startLoading('Processing...');
    try {
      await someApiCall();
    } finally {
      stopLoading();
    }
  };
}
```

### Using Loading Spinner Component

```typescript
import { LoadingSpinner } from '../components/LoadingSpinner';

// Inline loading
<LoadingSpinner message="Loading data..." size="medium" />

// Full screen loading
<LoadingSpinner message="Processing..." size="large" fullScreen />

// Small loading indicator
<LoadingSpinner size="small" />
```

### Local Loading State

```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  try {
    setLoading(true);
    await apiCall();
    showSuccess('Success!');
  } catch (error) {
    showError(error, 'Failed to submit');
  } finally {
    setLoading(false);
  }
};

return (
  <button disabled={loading}>
    {loading ? 'Loading...' : 'Submit'}
  </button>
);
```

## API Error Handling

The `handleApiCall` wrapper automatically converts Axios errors to `ApiError` instances with proper status codes and messages.

```typescript
import { handleApiCall } from '../services/api';

const data = await handleApiCall(
  apiClient.get('/endpoint')
    .then(response => response.data)
);
```

## Notification Types

- **Error** (red): For errors and failures
- **Warning** (yellow): For warnings and cautions
- **Info** (green): For success messages and information

Notifications automatically dismiss after 5 seconds or can be manually dismissed by clicking.
