// This file is deprecated - use the global useAuth hook directly instead
// The AuthProvider pattern was causing React Hooks violations

export function AuthProvider() {
  throw new Error("AuthProvider is deprecated. Use the global useAuth hook directly instead.")
}

export function useAuthContext() {
  throw new Error("useAuthContext is deprecated. Use the global useAuth hook directly instead.")
}
