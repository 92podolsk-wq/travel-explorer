// Races a promise against a timeout, resolving to `fallback` if it hasn't
// settled in time. Unlike a rejection, a native Capacitor plugin bridge call
// that never calls back (no resolve, no reject) just hangs forever — this
// guarantees the caller always gets an answer.
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
