/**
 * Configuration for MessageContainer implementation
 */

// List implementation type literal union
export type ListImplementationType = 'legacy' | 'legend' | 'flash';

export const MessageContainerConfig = {
  DEFAULT_LIST_TYPE: 'flash' as ListImplementationType,
} as const;

// ✅ Type-safe config
export type MessageContainerConfigType = typeof MessageContainerConfig;
