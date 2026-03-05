// lib/discord/errorHandler.ts
// Enhanced error handling with suggestions

import { Octokit } from 'octokit';

interface ErrorSuggestion {
  message: string;
  suggestion: string;
  action?: string;
}

/**
 * Get error message with suggestion based on error type
 */
export function getErrorWithSuggestion(error: any, context?: string): ErrorSuggestion {
  const status = error?.status;
  const message = error?.message || 'Unknown error';
  
  // 401 - Unauthorized
  if (status === 401) {
    return {
      message: '🔒 GitHub authentication failed',
      suggestion: 'Your GitHub token has expired or is invalid.',
      action: 'Please re-link your account at https://www.meridusdev.in.th',
    };
  }
  
  // 403 - Forbidden (rate limit or permissions)
  if (status === 403) {
    if (message.includes('rate limit')) {
      const resetTime = error?.response?.headers?.['x-ratelimit-reset'];
      const resetDate = resetTime ? new Date(resetTime * 1000).toLocaleTimeString() : 'soon';
      return {
        message: '⏱️ GitHub API rate limit exceeded',
        suggestion: `Rate limit will reset at ${resetDate}`,
        action: 'Please try again later or use a different command.',
      };
    }
    return {
      message: '🔒 Access denied',
      suggestion: 'You don\'t have permission to access this resource.',
      action: 'Make sure you have the correct access rights.',
    };
  }
  
  // 404 - Not Found
  if (status === 404) {
    if (context?.includes('repo')) {
      return {
        message: '❌ Repository not found',
        suggestion: 'The repository you specified doesn\'t exist or you don\'t have access to it.',
        action: 'Check the format: `owner/repo` (e.g., `facebook/react`)',
      };
    }
    if (context?.includes('issue')) {
      return {
        message: '❌ Issue not found',
        suggestion: 'The issue number you specified doesn\'t exist.',
        action: 'Check the issue number and try again.',
      };
    }
    if (context?.includes('pr')) {
      return {
        message: '❌ Pull request not found',
        suggestion: 'The PR number you specified doesn\'t exist.',
        action: 'Check the PR number and try again.',
      };
    }
    return {
      message: '❌ Resource not found',
      suggestion: 'The requested resource could not be found.',
      action: 'Check your input and try again.',
    };
  }
  
  // 422 - Validation Failed
  if (status === 422) {
    return {
      message: '❌ Validation failed',
      suggestion: 'The request could not be processed.',
      action: message || 'Check your input parameters.',
    };
  }
  
  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return {
      message: '🌐 Network error',
      suggestion: 'Could not connect to GitHub.',
      action: 'Please check your internet connection and try again.',
    };
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return {
      message: '⏱️ Request timed out',
      suggestion: 'GitHub is taking too long to respond.',
      action: 'Please try again in a moment.',
    };
  }
  
  // Default error
  return {
    message: '❌ An error occurred',
    suggestion: message,
    action: 'If this persists, please contact support.',
  };
}

/**
 * Format error for Discord display
 */
export function formatErrorMessage(error: any, context?: string): string {
  const { message, suggestion, action } = getErrorWithSuggestion(error, context);
  
  let result = `${message}\n\n**Suggestion:** ${suggestion}`;
  if (action) {
    result += `\n**Action:** ${action}`;
  }
  
  return result;
}

/**
 * Try to find similar repository names
 */
export async function findSimilarRepos(
  octokit: Octokit,
  attemptedRepo: string,
  userRepos: any[]
): Promise<string[]> {
  const attemptedName = attemptedRepo.toLowerCase().split('/')[1] || attemptedRepo.toLowerCase();
  
  const similar = userRepos
    .filter((repo: any) => {
      const repoName = repo.name.toLowerCase();
      const repoFullName = repo.full_name.toLowerCase();
      
      // Check for partial matches
      return (
        repoName.includes(attemptedName) ||
        attemptedName.includes(repoName) ||
        repoFullName.includes(attemptedName)
      );
    })
    .slice(0, 3)
    .map((repo: any) => repo.full_name);
  
  return similar;
}

/**
 * Check if repo format is valid
 */
export function isValidRepoFormat(repo: string): boolean {
  return repo.includes('/') && repo.split('/').length === 2;
}

/**
 * Suggest correct repo format
 */
export function suggestRepoFormat(input: string): string {
  // If it looks like a URL
  if (input.includes('github.com')) {
    const match = input.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (match) return match[1];
  }
  
  // If it has spaces or special chars
  if (input.includes(' ')) {
    return input.replace(/\s+/g, '-').toLowerCase();
  }
  
  return input;
}
