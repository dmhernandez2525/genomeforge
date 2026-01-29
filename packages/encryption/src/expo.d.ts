/**
 * Type declarations for Expo modules
 *
 * These are only used at build time for type checking.
 * The actual modules are loaded dynamically at runtime in React Native.
 */

declare module 'expo-crypto' {
  export function digestStringAsync(
    algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' | 'MD5',
    data: string
  ): Promise<string>;

  export function getRandomBytes(byteCount: number): Uint8Array;

  export function getRandomBytesAsync(byteCount: number): Promise<Uint8Array>;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;

  export function setItemAsync(key: string, value: string): Promise<void>;

  export function deleteItemAsync(key: string): Promise<void>;

  export function isAvailableAsync(): Promise<boolean>;
}
