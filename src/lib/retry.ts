/**
 * Retry a function with exponential backoff
 * @param fn The function to retry
 * @param maxRetries Maximum number of retries
 * @param retryDelay Initial delay in milliseconds
 * @param shouldRetry Function to determine if retry should be attempted
 * @returns Promise that resolves with the result of the function or rejects with the last error
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 300,
  shouldRetry: (error: any) => boolean = () => true
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt >= maxRetries || !shouldRetry(error)) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      
      // Add some jitter to prevent all retries happening at the same time
      const jitter = Math.random() * 100;
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError;
}

/**
 * Retry a function only for network errors
 * @param fn The function to retry
 * @param maxRetries Maximum number of retries
 * @returns Promise that resolves with the result of the function or rejects with the last error
 */
export async function retryNetworkErrors<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  return retry(
    fn,
    maxRetries,
    500,
    (error) => {
      // Don't retry 404 errors (not found) as they're not transient
      if (error?.response?.status === 404) {
        return false;
      }
      
      // Don't retry 400 errors (bad request) as they're client errors
      if (error?.response?.status === 400) {
        return false;
      }
      
      // Only retry network errors, timeout errors, or server errors (5xx)
      return (
        error?.message === 'Network Error' ||
        error?.code === 'ECONNABORTED' ||
        error?.code === 'ETIMEDOUT' ||
        // Also retry if the server returned a 5xx error
        (error?.response?.status >= 500 && error?.response?.status < 600)
      );
    }
  );
}

export default retry; 