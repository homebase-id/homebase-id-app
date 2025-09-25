/**
 * Configuration for MessageContainer implementation
 *
 * Set USE_LEGEND_LIST to true to use the new @legendapp/list implementation
 * Set USE_LEGEND_LIST to false to use the original FlatList implementation
 */

export const MessageContainerConfig = {
  USE_LEGEND_LIST: true, // Retour à Legend List avec solution alternative
} as const;

// ✅ Type-safe config
export type MessageContainerConfigType = typeof MessageContainerConfig;
