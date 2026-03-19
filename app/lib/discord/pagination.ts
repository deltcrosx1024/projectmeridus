// lib/discord/pagination.ts
// Pagination system for long lists with Discord buttons
// Uses Redis for persistence across serverless instances

import { redis } from '../redis';
import { DiscordEmbed, InteractionResponseType } from '@/app/types/discord';

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface PaginationState {
  userId: string;
  command: string;
  data: unknown[];
  currentPage: number;
  perPage: number;
  totalPages: number;
}

const PAGINATION_PREFIX = 'meridus:pagination:';
const PAGINATION_TTL = 600; // 10 minutes

function getPaginationKey(id: string): string {
  return `${PAGINATION_PREFIX}${id}`;
}

/**
 * Generate pagination buttons
 */
export function generatePaginationButtons(
  currentPage: number,
  totalPages: number,
  customIdPrefix: string
): any[] {
  const buttons = [
    {
      type: 2,
      style: 1, // PRIMARY
      custom_id: `${customIdPrefix}:first`,
      emoji: { name: '⏮️' },
      disabled: currentPage === 1,
    },
    {
      type: 2,
      style: 1, // PRIMARY
      custom_id: `${customIdPrefix}:prev`,
      emoji: { name: '◀️' },
      disabled: currentPage === 1,
    },
    {
      type: 2,
      style: 2, // SECONDARY
      custom_id: `${customIdPrefix}:page`,
      label: `Page ${currentPage}/${totalPages}`,
      disabled: true,
    },
    {
      type: 2,
      style: 1, // PRIMARY
      custom_id: `${customIdPrefix}:next`,
      emoji: { name: '▶️' },
      disabled: currentPage === totalPages,
    },
    {
      type: 2,
      style: 1, // PRIMARY
      custom_id: `${customIdPrefix}:last`,
      emoji: { name: '⏭️' },
      disabled: currentPage === totalPages,
    },
  ];

  return [
    {
      type: 1, // ACTION_ROW
      components: buttons,
    },
  ];
}

/**
 * Store pagination state in Redis
 */
export function storePaginationState(state: PaginationState): string {
  const id = `${state.userId}:${state.command}:${Date.now()}`;
  const key = getPaginationKey(id);
  
  redis.setex(key, PAGINATION_TTL, JSON.stringify(state)).catch(err => {
    console.error('[Pagination] Failed to store state:', err);
  });
  
  return id;
}

/**
 * Get pagination state from Redis
 */
export async function getPaginationState(id: string): Promise<PaginationState | undefined> {
  try {
    const key = getPaginationKey(id);
    const data = await redis.get<string>(key);
    if (!data) return undefined;
    
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data as PaginationState;
  } catch (err) {
    console.error('[Pagination] Failed to get state:', err);
    return undefined;
  }
}

/**
 * Handle pagination button click
 */
export async function handlePagination(
  stateId: string,
  action: 'first' | 'prev' | 'next' | 'last'
): Promise<{ page: number; state: PaginationState | null }> {
  const state = await getPaginationState(stateId);
  if (!state) return { page: 1, state: null };
  
  let newPage = state.currentPage;
  
  switch (action) {
    case 'first':
      newPage = 1;
      break;
    case 'prev':
      newPage = Math.max(1, state.currentPage - 1);
      break;
    case 'next':
      newPage = Math.min(state.totalPages, state.currentPage + 1);
      break;
    case 'last':
      newPage = state.totalPages;
      break;
  }
  
  state.currentPage = newPage;
  
  // Update in Redis
  const key = getPaginationKey(stateId);
  await redis.setex(key, PAGINATION_TTL, JSON.stringify(state)).catch(err => {
    console.error('[Pagination] Failed to update state:', err);
  });
  
  return { page: newPage, state };
}

/**
 * Get paginated slice of data
 */
export function getPaginatedSlice<T>(
  data: T[],
  page: number,
  perPage: number
): T[] {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return data.slice(start, end);
}

/**
 * Format pagination footer text
 */
export function formatPaginationFooter(
  currentPage: number,
  totalPages: number,
  totalItems: number
): string {
  return `Page ${currentPage}/${totalPages} • ${totalItems} total items`;
}
