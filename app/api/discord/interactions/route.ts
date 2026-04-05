import { verifyKey } from 'discord-interactions';
import { commands } from '@/app/lib/discord/commands';
import { 
  DiscordInteraction, 
  InteractionType, 
  InteractionResponseType 
} from '@/app/types/discord';
import { handleAutocomplete as handleAutocompleteLogic } from '@/app/lib/discord/autocomplete';
import { getUserLink } from '@/app/lib/userLinks';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
if (!DISCORD_PUBLIC_KEY) {
  throw new Error('DISCORD_PUBLIC_KEY environment variable is required');
}

/**
 * Fetch with timeout to prevent hanging requests
 */
async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  } finally {
    clearTimeout(id);
  }
}

interface CommandResult {
  content?: string;
  embeds?: any[]; // Discord API Embed[]
  components?: any[]; // Discord API Component[]
  ephemeral?: boolean;
}

/**
 * Get the GitHub token for a user from their Discord interaction
 */
async function getGitHubTokenFromInteraction(interaction: DiscordInteraction): Promise<string | null> {
  try {
    const discordUserId = interaction.member?.user?.id || interaction.user?.id;
    
    if (!discordUserId) {
      console.error('[Discord] No user ID found in interaction', { 
        interactionId: interaction.id,
        hasMember: !!interaction.member,
        hasUser: !!interaction.user
      });
      return null;
    }
    
    const userLink = await getUserLink(discordUserId);
    
    if (!userLink) {
      console.warn(`[Discord] No GitHub link found for user ${discordUserId}`, { 
        userId: discordUserId,
        interactionId: interaction.id
      });
      return null;
    }
    
    if (!userLink.githubToken) {
      console.error(`[Discord] GitHub token missing for user ${discordUserId}`, { 
        userId: discordUserId,
        interactionId: interaction.id,
        hasVercelToken: !!userLink.vercelToken
      });
      return null;
    }
    
    return userLink.githubToken;
  } catch (error) {
    // Distinguish between different error types
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('No user')) {
        console.warn(`[Discord] User link not found for Discord user`, {
          interactionId: interaction.id,
          error: error.message
        });
        return null;
      }
      
      if (error.message.includes('database') || error.message.includes('connection')) {
        console.error(`[Discord] Database error while fetching user link:`, error, {
          interactionId: interaction.id
        });
        // Return null for database errors to allow graceful degradation
        return null;
      }
    }
    
    console.error('[Discord] Failed to get GitHub token from interaction:', error, {
      interactionId: interaction.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

/**
 * Execute a rebase via GitHub API
 */
async function executeRebase(repo: string, prNumber: string, githubToken: string): Promise<void> {
  // Input validation
  if (!repo || typeof repo !== 'string' || !repo.includes('/')) {
    throw new Error('Invalid repository format: expected "owner/repo"');
  }
  
  if (!prNumber || !/^\d+$/.test(prNumber)) {
    throw new Error('Invalid PR number: must be a positive integer');
  }
  
  if (!githubToken || typeof githubToken !== 'string') {
    throw new Error('GitHub token is required');
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName || owner.trim() === '' || repoName.trim() === '') {
    throw new Error('Invalid repository format: owner and repo name cannot be empty');
  }

  try {
    // Get PR details with timeout
    const prResponse = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
      },
      10000 // 10 second timeout
    );

    if (!prResponse.ok) {
      const errorDetails = await prResponse.text().catch(() => 'Unknown error');
      throw new Error(`Failed to get PR details (${prResponse.status}): ${prResponse.statusText} - ${errorDetails.substring(0, 200)}`);
    }

    const pr = await prResponse.json();

    // Update branch with timeout
    const updateResponse = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/update-branch`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
        body: JSON.stringify({ expected_head_sha: pr.head.sha }),
      },
      15000 // 15 second timeout for update operation
    );

    if (!updateResponse.ok && updateResponse.status !== 202) {
      const errorDetails = await updateResponse.json().catch(() => ({ message: updateResponse.statusText }));
      const errorMessage = errorDetails?.message || updateResponse.statusText || 'Unknown error';
      throw new Error(`Failed to rebase PR ${prNumber}: ${errorMessage.substring(0, 200)} (Status: ${updateResponse.status})`);
    }
   } catch (error) {
     if (error instanceof Error && error.name === 'TimeoutError') {
       throw new Error(`GitHub API request timed out: ${error.message}`);
     }
     throw error;
   }
}

/**
 * Create a new issue via GitHub API
 */
async function createIssue(repo: string, title: string, body: string, githubToken: string): Promise<{ url: string }> {
  // Input validation
  if (!repo || typeof repo !== 'string' || !repo.includes('/')) {
    throw new Error('Invalid repository format: expected "owner/repo"');
  }
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new Error('Issue title is required and cannot be empty');
  }
  
  if (title.length > 255) {
    throw new Error('Issue title cannot exceed 255 characters');
  }
  
  if (!githubToken || typeof githubToken !== 'string') {
    throw new Error('GitHub token is required');
  }
  
  // Body can be empty but must be string
  if (body === undefined || body === null) {
    throw new Error('Issue body must be a string');
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName || owner.trim() === '' || repoName.trim() === '') {
    throw new Error('Invalid repository format: owner and repo name cannot be empty');
  }

  try {
    const response = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
        body: JSON.stringify({ title, body: body || '' }),
      },
      10000 // 10 second timeout
    );

    if (!response.ok) {
      const errorDetails = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to create issue (${response.status}): ${response.statusText} - ${errorDetails.substring(0, 200)}`);
    }

    const issue = await response.json();
    return { url: issue.html_url };
   } catch (error) {
     if (error instanceof Error && error.name === 'TimeoutError') {
       throw new Error(`GitHub API request timed out while creating issue: ${error.message}`);
     }
     throw error;
   }
}

/**
 * Create a new pull request via GitHub API
 */
async function createPullRequest(repo: string, title: string, body: string, head: string, githubToken: string, base: string = 'main'): Promise<{ url: string }> {
  // Input validation
  if (!repo || typeof repo !== 'string' || !repo.includes('/')) {
    throw new Error('Invalid repository format: expected "owner/repo"');
  }
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new Error('PR title is required and cannot be empty');
  }
  
  if (title.length > 255) {
    throw new Error('PR title cannot exceed 255 characters');
  }
  
  if (!head || typeof head !== 'string' || head.trim() === '') {
    throw new Error('Head branch is required and cannot be empty');
  }
  
  if (!base || typeof base !== 'string') {
    throw new Error('Base branch is required');
  }
  
  if (!githubToken || typeof githubToken !== 'string') {
    throw new Error('GitHub token is required');
  }
  
  // Body can be empty but must be string
  if (body === undefined || body === null) {
    throw new Error('PR body must be a string');
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName || owner.trim() === '' || repoName.trim() === '') {
    throw new Error('Invalid repository format: owner and repo name cannot be empty');
  }

  try {
    const response = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/pulls`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
        body: JSON.stringify({ title, body: body || '', head, base }),
      },
      15000 // 15 second timeout for PR creation
    );

    if (!response.ok) {
      const errorDetails = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to create PR (${response.status}): ${response.statusText} - ${errorDetails.substring(0, 200)}`);
    }

    const pr = await response.json();
    return { url: pr.html_url };
   } catch (error) {
     if (error instanceof Error && error.name === 'TimeoutError') {
       throw new Error(`GitHub API request timed out while creating PR: ${error.message}`);
     }
     throw error;
   }
}

/**
 * Merge a pull request via GitHub API
 */
async function mergePullRequest(repo: string, prNumber: string, githubToken: string, method: string = 'merge'): Promise<void> {
  // Input validation
  if (!repo || typeof repo !== 'string' || !repo.includes('/')) {
    throw new Error('Invalid repository format: expected "owner/repo"');
  }
  
  if (!prNumber || !/^\d+$/.test(prNumber)) {
    throw new Error('Invalid PR number: must be a positive integer');
  }
  
  // Validate merge method
  const validMethods = ['merge', 'squash', 'rebase'];
  if (!method || typeof method !== 'string' || !validMethods.includes(method)) {
    throw new Error(`Invalid merge method: must be one of ${validMethods.join(', ')}`);
  }
  
  if (!githubToken || typeof githubToken !== 'string') {
    throw new Error('GitHub token is required');
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName || owner.trim() === '' || repoName.trim() === '') {
    throw new Error('Invalid repository format: owner and repo name cannot be empty');
  }

  try {
    const response = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/merge`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
        body: JSON.stringify({ merge_method: method }),
      },
      15000 // 15 second timeout for merge operation
    );

    if (!response.ok) {
      // 405 means method not allowed (already merged) - this is acceptable
      if (response.status === 405) {
        // PR is already merged, consider this a success
        return;
      }
      
      const errorDetails = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to merge PR (${response.status}): ${response.statusText} - ${errorDetails.substring(0, 200)}`);
    }
   } catch (error) {
     if (error instanceof Error && error.name === 'TimeoutError') {
       throw new Error(`GitHub API request timed out while merging PR: ${error.message}`);
     }
     throw error;
   }
}

/**
 * Add a comment to a pull request or issue via GitHub API
 * Both PRs and Issues share the same GitHub Issues comments endpoint
 */
async function addComment(repo: string, number: string, body: string, githubToken: string): Promise<{ url: string }> {
  // Input validation
  if (!repo || typeof repo !== 'string' || !repo.includes('/')) {
    throw new Error('Invalid repository format: expected "owner/repo"');
  }
  
  if (!number || !/^\d+$/.test(number)) {
    throw new Error('Issue/PR number must be a positive integer');
  }
  
  if (!body || typeof body !== 'string' || body.trim() === '') {
    throw new Error('Comment body is required and cannot be empty');
  }
  
  if (body.length > 65536) { // GitHub comment limit is 65,536 characters
    throw new Error('Comment body cannot exceed 65,536 characters');
  }
  
  if (!githubToken || typeof githubToken !== 'string') {
    throw new Error('GitHub token is required');
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName || owner.trim() === '' || repoName.trim() === '') {
    throw new Error('Invalid repository format: owner and repo name cannot be empty');
  }

    try {
      const response = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repoName}/issues/${number}/comments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Meridus-Discord-Bot/1.0',
          },
          body: JSON.stringify({ body }),
        },
        10000 // 10 second timeout
      );

      // Handle specific error cases
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Issue/PR #${number} not found in repository ${repo}`);
        }
        
        const errorDetails = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to add comment (${response.status}): ${response.statusText} - ${errorDetails.substring(0, 200)}`);
      }

      const comment = await response.json();
      return { url: comment.html_url };
     } catch (error) {
       if (error instanceof Error && error.name === 'TimeoutError') {
         throw new Error(`GitHub API request timed out while adding comment: ${error.message}`);
       }
       throw error;
     }
}

/**
 * Close a pull request via GitHub API
 */
async function closePullRequest(repo: string, prNumber: string, githubToken: string): Promise<void> {
  // Input validation
  if (!repo || typeof repo !== 'string' || !repo.includes('/')) {
    throw new Error('Invalid repository format: expected "owner/repo"');
  }
  
  if (!prNumber || !/^\d+$/.test(prNumber)) {
    throw new Error('Invalid PR number: must be a positive integer');
  }
  
  if (!githubToken || typeof githubToken !== 'string') {
    throw new Error('GitHub token is required');
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName || owner.trim() === '' || repoName.trim() === '') {
    throw new Error('Invalid repository format: owner and repo name cannot be empty');
  }

  try {
    // First check if PR exists and get current state
    const checkResponse = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
      },
      10000 // 10 second timeout
    );

    if (!checkResponse.ok) {
      if (checkResponse.status === 404) {
        throw new Error(`PR #${prNumber} not found in repository ${repo}`);
      }
      
      const errorDetails = await checkResponse.text().catch(() => 'Unknown error');
      throw new Error(`Failed to check PR status (${checkResponse.status}): ${checkResponse.statusText} - ${errorDetails.substring(0, 200)}`);
    }

    const pr = await checkResponse.json();
    
    // If PR is already closed, consider it a success
    if (pr.state === 'closed') {
      return;
    }

    // If PR is merged, we can't close it (it's already effectively closed)
    if (pr.merged) {
      return;
    }

    // Proceed to close the PR
    const response = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
        body: JSON.stringify({ state: 'closed' }),
      },
      10000 // 10 second timeout
    );

    if (!response.ok) {
      const errorDetails = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to close PR (${response.status}): ${response.statusText} - ${errorDetails.substring(0, 200)}`);
    }
   } catch (error) {
     if (error instanceof Error && error.name === 'TimeoutError') {
       throw new Error(`GitHub API request timed out while closing PR: ${error.message}`);
     }
     throw error;
   }
}

/**
 * Close an issue via GitHub API
 */
async function closeIssue(repo: string, issueNumber: string, githubToken: string): Promise<void> {
  // Input validation
  if (!repo || typeof repo !== 'string' || !repo.includes('/')) {
    throw new Error('Invalid repository format: expected "owner/repo"');
  }
  
  if (!issueNumber || !/^\d+$/.test(issueNumber)) {
    throw new Error('Issue number must be a positive integer');
  }
  
  if (!githubToken || typeof githubToken !== 'string') {
    throw new Error('GitHub token is required');
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName || owner.trim() === '' || repoName.trim() === '') {
    throw new Error('Invalid repository format: owner and repo name cannot be empty');
  }

  try {
    // First check if issue exists and get current state
    const checkResponse = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
      },
      10000 // 10 second timeout
    );

    if (!checkResponse.ok) {
      if (checkResponse.status === 404) {
        throw new Error(`Issue #${issueNumber} not found in repository ${repo}`);
      }
      
      const errorDetails = await checkResponse.text().catch(() => 'Unknown error');
      throw new Error(`Failed to check issue status (${checkResponse.status}): ${checkResponse.statusText} - ${errorDetails.substring(0, 200)}`);
    }

    const issue = await checkResponse.json();
    
    // If issue is already closed, consider it a success
    if (issue.state === 'closed') {
      return;
    }

    // Proceed to close the issue
    const response = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
        body: JSON.stringify({ state: 'closed' }),
      },
      10000 // 10 second timeout
    );

    if (!response.ok) {
      const errorDetails = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to close issue (${response.status}): ${response.statusText} - ${errorDetails.substring(0, 200)}`);
    }
   } catch (error) {
     if (error instanceof Error && error.name === 'TimeoutError') {
       throw new Error(`GitHub API request timed out while closing issue: ${error.message}`);
     }
     throw error;
   }
}

/**
 * Reopen an issue via GitHub API
 */
async function reopenIssue(repo: string, issueNumber: string, githubToken: string): Promise<void> {
  // Input validation
  if (!repo || typeof repo !== 'string' || !repo.includes('/')) {
    throw new Error('Invalid repository format: expected "owner/repo"');
  }
  
  if (!issueNumber || !/^\d+$/.test(issueNumber)) {
    throw new Error('Issue number must be a positive integer');
  }
  
  if (!githubToken || typeof githubToken !== 'string') {
    throw new Error('GitHub token is required');
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName || owner.trim() === '' || repoName.trim() === '') {
    throw new Error('Invalid repository format: owner and repo name cannot be empty');
  }

  try {
    // First check if issue exists and get current state
    const checkResponse = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
      },
      10000 // 10 second timeout
    );

    if (!checkResponse.ok) {
      if (checkResponse.status === 404) {
        throw new Error(`Issue #${issueNumber} not found in repository ${repo}`);
      }
      
      const errorDetails = await checkResponse.text().catch(() => 'Unknown error');
      throw new Error(`Failed to check issue status (${checkResponse.status}): ${checkResponse.statusText} - ${errorDetails.substring(0, 200)}`);
    }

    const issue = await checkResponse.json();
    
    // If issue is already open, consider it a success
    if (issue.state === 'open') {
      return;
    }

    // Proceed to reopen the issue
    const response = await fetchWithTimeout(
      `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Meridus-Discord-Bot/1.0',
        },
        body: JSON.stringify({ state: 'open' }),
      },
      10000 // 10 second timeout
    );

    if (!response.ok) {
      const errorDetails = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to reopen issue (${response.status}): ${response.statusText} - ${errorDetails.substring(0, 200)}`);
    }
   } catch (error) {
     if (error instanceof Error && error.name === 'TimeoutError') {
       throw new Error(`GitHub API request timed out while reopening issue: ${error.message}`);
     }
     throw error;
   }
}

function createResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      // Add security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  });
}

function createErrorResponse(message: string, status = 400): Response {
  return createResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: message },
  }, status);
}

function buildCommandResponse(result: CommandResult): Response {
  const responseData: Record<string, unknown> = {
    content: result.content || '',
  };

  if (result.embeds?.length) {
    responseData.embeds = result.embeds;
  }

  if (result.components?.length) {
    responseData.components = result.components;
  }

   // Handle flags properly using bitwise operations
   // Bit 6 (value 64) = EPHEMERAL flag
   if (result.ephemeral) {
     // Preserve any existing flags and add the ephemeral flag
     responseData.flags = ((responseData.flags as number) || 0) | 64;
   }

  return createResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: responseData,
  });
}

async function verifyDiscordRequest(request: Request): Promise<{ valid: boolean; body: string }> {
  const signature = request.headers.get('x-signature-ed25519') || '';
  const timestamp = request.headers.get('x-signature-timestamp') || '';

  // Input validation for required headers
  if (!signature) {
    console.error('[Discord] Missing x-signature-ed25519 header');
    return { valid: false, body: '' };
  }

  if (!timestamp) {
    console.error('[Discord] Missing x-signature-timestamp header');
    return { valid: false, body: '' };
  }

  // Validate timestamp is a number and within tolerance (5 minutes)
  const timestampNum = Number.parseInt(timestamp, 10);
  if (Number.isNaN(timestampNum)) {
    console.error('[Discord] Invalid timestamp format');
    return { valid: false, body: '' };
  }

  const now = Date.now();
  if (Math.abs(now - timestampNum) > 5 * 60 * 1000) {
    console.error('[Discord] Timestamp outside tolerance window');
    return { valid: false, body: '' };
  }

  console.log('[Discord] Headers:', {
    signature: signature ? 'present' : 'missing',
    timestamp: timestamp ? 'present' : 'missing',
    publicKey: DISCORD_PUBLIC_KEY ? 'present' : 'missing',
  });

  if (!DISCORD_PUBLIC_KEY) {
    console.error('[Discord] Public key not configured');
    return { valid: false, body: '' };
  }

  const bodyBuffer = await request.arrayBuffer();
  const body = new TextDecoder('utf-8').decode(bodyBuffer);

  // Validate body is not empty
  if (!body || body.length === 0) {
    console.error('[Discord] Empty request body');
    return { valid: false, body: '' };
  }

  // Limit body size to prevent abuse
  // Discord interaction payloads are typically small, but set reasonable limit
  if (body.length > 1024 * 1024) { // 1MB limit
    console.error('[Discord] Request body too large');
    return { valid: false, body: '' };
  }

  try {
    const isValid = await verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY);
    return { valid: isValid, body };
  } catch (err) {
    console.error('[Discord] Signature verification error:', err);
    return { valid: false, body };
  }
}

function handlePing(): Response {
  console.log('[Discord] Responding to PING with PONG');
  return createResponse({ type: InteractionResponseType.PONG });
}

async function handleApplicationCommand(interaction: DiscordInteraction): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Validate interaction structure
    const validationError = validateInteraction(interaction);
    if (validationError) {
      return validationError;
    }

    const commandName = interaction.data?.name;
    
    // Validate command name
    const commandNameError = validateCommandName(commandName, interaction.id, interaction.data);
    if (commandNameError) {
      return commandNameError;
    }

    // At this point, commandName is guaranteed to be a non-empty string
    console.log(`[Discord] Executing command: /${commandName}`, { 
      interactionId: interaction.id,
      userId: interaction.member?.user?.id || interaction.user?.id
    });

    const command = commands[commandName as string];
    
    // Validate command exists
    if (!command) {
      console.warn(`[Discord] Unknown command: ${commandName}`, { 
        interactionId: interaction.id,
        commandName
      });
      return createErrorResponse(
        `❌ Unknown command: **${commandName}**\nUse **/list** to see available commands.`
      );
    }

    // Validate command has execute method
    if (!command.execute || typeof command.execute !== 'function') {
      console.error(`[Discord] Command ${commandName} missing execute method`, { 
        interactionId: interaction.id,
        commandName
      });
      return createErrorResponse('❌ Internal command error');
    }

    try {
      const result = await command.execute(interaction);
      const endTime = Date.now();
      
      console.log(`[Discord] Command /${commandName} executed successfully in ${endTime - startTime}ms`, { 
        interactionId: interaction.id,
        commandName,
        durationMs: endTime - startTime
      });
      
      return buildCommandResponse(result);
    } catch (executeError: unknown) {
      const endTime = Date.now();
      const errorMessage = executeError instanceof Error ? executeError.message : 'Unknown error';
      
      console.error(`[Discord] Error executing command ${commandName} after ${endTime - startTime}ms:`, executeError, { 
        interactionId: interaction.id,
        commandName,
        durationMs: endTime - startTime,
        error: executeError instanceof Error ? {
          message: executeError.message,
          stack: executeError.stack
        } : executeError
      });
      
      // Provide more specific error messages based on error type
      if (executeError instanceof Error) {
        if (executeError.message.includes('timeout') || executeError.message.includes('TimeoutError')) {
          return createErrorResponse('❌ Command execution timed out. Please try again.');
        }
        if (executeError.message.includes('GitHub') && (executeError.message.includes('token') || executeError.message.includes('authentication'))) {
          return createErrorResponse('❌ GitHub authentication failed. Please re-link your account.');
        }
        if (executeError.message.includes('rate limit') || executeError.message.includes('403')) {
          return createErrorResponse('❌ Rate limit exceeded. Please wait a moment and try again.');
        }
      }
      
      // Return a generic error message to avoid exposing internal details
      return createErrorResponse('❌ Error executing command. Please try again later.');
    }
  } catch (err: unknown) {
    const endTime = Date.now();
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    console.error(`[Discord] Unexpected error handling command after ${endTime - startTime}ms:`, err, { 
      interactionId: interaction.id,
      durationMs: endTime - startTime,
      error: err instanceof Error ? {
        message: err.message,
        stack: err.stack
      } : err
    });
    
    return createErrorResponse('❌ An unexpected error occurred. Please try again later.');
  }
}

// Helper function to validate interaction structure
function validateInteraction(interaction: DiscordInteraction): Response | null {
  if (!interaction || typeof interaction !== 'object') {
    console.error('[Discord] Invalid interaction object received');
    return createErrorResponse('❌ Invalid interaction data');
  }

  if (!interaction.data || typeof interaction.data !== 'object') {
    console.error('[Discord] Missing or invalid interaction data');
    return createErrorResponse('❌ Invalid command data');
  }
  
  return null;
}

// Helper function to validate command name
function validateCommandName(commandName: string | undefined, interactionId: string, interactionData: any): Response | null {
  if (!commandName || typeof commandName !== 'string') {
    console.error('[Discord] No command name in interaction data', { 
      interactionId: interactionId,
      data: interactionData
    });
    return createErrorResponse('❌ No command name provided.');
  }

  // Additional command name validation
  if (commandName.length > 100) {
    console.error('[Discord] Command name too long', { 
      interactionId: interactionId,
      commandNameLength: commandName.length
    });
    return createErrorResponse('❌ Command name is too long');
  }
  
  return null;
}

function createRebaseModal(repo: string, prNumber: string): Response {
  return createResponse({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: `gh:rebase:${repo}:${prNumber}:execute`,
      title: '⚠️ Confirm Rebase',
      components: [{
        type: 1,
        components: [{
          type: 4,
          custom_id: 'confirm_text',
          label: 'Type "REBASE" to confirm',
          style: 1,
          min_length: 6,
          max_length: 6,
          required: true,
          placeholder: 'REBASE',
        }],
      }],
    },
  });
}

function createIssueModal(repo: string): Response {
  return createResponse({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: `gh:create_issue:${repo}:execute`,
      title: '📋 Create Issue',
      components: [
        {
          type: 1,
          components: [{
            type: 4,
            custom_id: 'issue_title',
            label: 'Issue Title',
            style: 1,
            required: true,
            placeholder: 'Enter issue title',
          }],
        },
        {
          type: 1,
          components: [{
            type: 4,
            custom_id: 'issue_body',
            label: 'Description',
            style: 2,
            required: false,
            placeholder: 'Describe the issue...',
          }],
        },
      ],
    },
  });
}

function createPRModal(repo: string, branch: string): Response {
  return createResponse({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: `gh:create_pr:${repo}:${branch}:execute`,
      title: '🔀 Create Pull Request',
      components: [
        {
          type: 1,
          components: [{
            type: 4,
            custom_id: 'pr_title',
            label: 'PR Title',
            style: 1,
            required: true,
            placeholder: 'Enter PR title',
          }],
        },
        {
          type: 1,
          components: [{
            type: 4,
            custom_id: 'pr_body',
            label: 'Description',
            style: 2,
            required: false,
            placeholder: 'Describe your changes...',
          }],
        },
        {
          type: 1,
          components: [{
            type: 4,
            custom_id: 'pr_base',
            label: 'Base Branch',
            style: 1,
            required: true,
            placeholder: 'main',
            value: 'main',
          }],
        },
      ],
    },
  });
}

function createMergeModal(repo: string, prNumber: string): Response {
  return createResponse({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: `gh:merge:${repo}:${prNumber}:execute`,
      title: '✅ Merge Pull Request',
      components: [
        {
          type: 1,
          components: [{
            type: 4,
            custom_id: 'merge_title',
            label: 'Merge Commit Title (optional)',
            style: 1,
            required: false,
            placeholder: 'Leave empty for default',
          }],
        },
        {
          type: 1,
          components: [{
            type: 4,
            custom_id: 'merge_message',
            label: 'Merge Commit Message (optional)',
            style: 2,
            required: false,
            placeholder: 'Describe the merge...',
          }],
        },
      ],
    },
  });
}

function createCommentModal(repo: string, prNumber: string, isIssue: boolean = false): Response {
  const type = isIssue ? 'Issue' : 'PR';
  const customIdBase = isIssue ? `gh:comment_issue:${repo}:${prNumber}:execute` : `gh:comment:${repo}:${prNumber}:execute`;
  
  return createResponse({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: customIdBase,
      title: `💬 Comment on ${type} #${prNumber}`,
      components: [
        {
          type: 1,
          components: [{
            type: 4,
            custom_id: 'comment_body',
            label: 'Comment',
            style: 2,
            required: true,
            placeholder: 'Write your comment...',
          }],
        },
      ],
    },
  });
}

function parseCustomId(customId: string): { repo: string; number: string } | null {
  const parts = customId.split(':');
  if (parts.length < 4) return null;
  const repo = parts[2];
  const number = parts[3];
  if (!repo || !number) return null;
  return { repo, number };
}

function parseCreateIssueData(customId: string): { repo: string } | null {
  const parts = customId.split(':');
  if (parts.length < 3) return null;
  const repo = parts[2];
  if (!repo) return null;
  return { repo };
}

function parseCreatePRData(customId: string): { repo: string; branch: string } | null {
  const parts = customId.split(':');
  if (parts.length < 4) return null;
  const repo = parts[2];
  const branch = parts[3];
  if (!repo || !branch) return null;
  return { repo, branch };
}

function isRebaseConfirm(customId: string): boolean {
  return customId.startsWith('gh:rebase:') && customId.endsWith(':confirm');
}

function isRebaseExecute(customId: string): boolean {
  return customId.startsWith('gh:rebase:') && customId.endsWith(':execute');
}

function parseRebaseData(customId: string): { repo: string; prNumber: string } | null {
  const parts = customId.split(':');
  if (parts.length < 4) return null;
  const repo = parts[2];
  const prNumber = parts[3];
  if (!repo || !prNumber) return null;
  return { repo, prNumber };
}

async function handleRebaseExecute(repo: string, prNumber: string, interaction: DiscordInteraction): Promise<Response> {
  const githubToken = await getGitHubTokenFromInteraction(interaction);
  
  if (!githubToken) {
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ No GitHub account linked. Please use \`/link\` to connect your GitHub account first.`,
        flags: 64,
      },
    });
  }

  try {
    await executeRebase(repo, prNumber, githubToken);
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Rebase initiated for **${repo}#${prNumber}**`,
        flags: 64,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Discord] Rebase error:', err);
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ Failed to rebase: ${errorMessage}`,
        flags: 64,
      },
    });
  }
}

async function handleMessageComponent(interaction: DiscordInteraction): Promise<Response> {
  const customId = interaction.data?.custom_id || '';
  console.log(`[Discord] Component interaction: ${customId}`);

  // Rebase confirmation modal
  if (isRebaseConfirm(customId)) {
    const data = parseRebaseData(customId);
    if (data) {
      return createRebaseModal(data.repo, data.prNumber);
    }
  }

  // Create Issue button
  if (customId.startsWith('gh:create_issue:') && !customId.includes(':execute')) {
    const data = parseCreateIssueData(customId);
    if (data) {
      return createIssueModal(data.repo);
    }
  }

  // Create PR button
  if (customId.startsWith('gh:create_pr:') && !customId.includes(':execute')) {
    const data = parseCreatePRData(customId);
    if (data) {
      return createPRModal(data.repo, data.branch);
    }
  }

  // Merge PR button
  if (customId.startsWith('gh:merge:') && !customId.includes(':execute')) {
    const data = parseCustomId(customId);
    if (data) {
      return createMergeModal(data.repo, data.number);
    }
  }

  // Comment on PR button
  if (customId.startsWith('gh:comment:') && !customId.includes(':execute')) {
    const data = parseCustomId(customId);
    if (data) {
      return createCommentModal(data.repo, data.number, false);
    }
  }

  // Comment on Issue button
  if (customId.startsWith('gh:comment_issue:') && !customId.includes(':execute')) {
    const data = parseCustomId(customId);
    if (data) {
      return createCommentModal(data.repo, data.number, true);
    }
  }

  // Close PR - execute directly
  if (customId.startsWith('gh:close_pr:')) {
    const data = parseCustomId(customId);
    if (data) {
      return await closePRHandler(data.repo, data.number, interaction);
    }
  }

  // Close Issue - execute directly
  if (customId.startsWith('gh:close_issue:')) {
    const data = parseCustomId(customId);
    if (data) {
      return await closeIssueHandler(data.repo, data.number, interaction);
    }
  }

  // Reopen Issue - execute directly
  if (customId.startsWith('gh:reopen_issue:')) {
    const data = parseCustomId(customId);
    if (data) {
      return await reopenIssueHandler(data.repo, data.number, interaction);
    }
  }

  // Review PR - open GitHub
  if (customId.startsWith('gh:review_pr:')) {
    const data = parseCustomId(customId);
    if (data) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `👀 Opening PR for review: https://github.com/${data.repo}/pull/${data.number}`,
          flags: 64,
        },
      });
    }
  }

  // Reply to comment - show message
  if (customId.startsWith('gh:reply:')) {
    const data = parseCustomId(customId);
    if (data) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `💬 To reply to a comment, please use the **Comment** button on the original message.`,
          flags: 64,
        },
      });
    }
  }

   // Code Review button - show message to use Create PR
   if (customId.startsWith('gh:review:')) {
     const data = parseCreatePRData(customId);
     if (data) {
       return createResponse({
         type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
         data: {
           content: `👀 To start a code review, please create a Pull Request first using the **Create PR** button.`,
           flags: 64,
         },
       });
     }
   }

   // Return error for unhandled component types
   return createErrorResponse(`❌ Unhandled component interaction: **${customId}**`);
}

// Handler functions for direct actions
async function closePRHandler(repo: string, prNumber: string, interaction: DiscordInteraction): Promise<Response> {
  const githubToken = await getGitHubTokenFromInteraction(interaction);
  
  if (!githubToken) {
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ No GitHub account linked. Please use \`/link\` to connect your GitHub account first.`,
        flags: 64,
      },
    });
  }

  try {
    await closePullRequest(repo, prNumber, githubToken);
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ PR **${repo}#${prNumber}** has been closed!`,
        flags: 64,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ Failed to close PR: ${errorMessage}`,
        flags: 64,
      },
    });
  }
}

async function closeIssueHandler(repo: string, issueNumber: string, interaction: DiscordInteraction): Promise<Response> {
  const githubToken = await getGitHubTokenFromInteraction(interaction);
  
  if (!githubToken) {
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ No GitHub account linked. Please use \`/link\` to connect your GitHub account first.`,
        flags: 64,
      },
    });
  }

  try {
    await closeIssue(repo, issueNumber, githubToken);
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Issue **${repo}#${issueNumber}** has been closed!`,
        flags: 64,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ Failed to close issue: ${errorMessage}`,
        flags: 64,
      },
    });
  }
}

async function reopenIssueHandler(repo: string, issueNumber: string, interaction: DiscordInteraction): Promise<Response> {
  const githubToken = await getGitHubTokenFromInteraction(interaction);
  
  if (!githubToken) {
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ No GitHub account linked. Please use \`/link\` to connect your GitHub account first.`,
        flags: 64,
      },
    });
  }

  try {
    await reopenIssue(repo, issueNumber, githubToken);
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Issue **${repo}#${issueNumber}** has been reopened!`,
        flags: 64,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ Failed to reopen issue: ${errorMessage}`,
        flags: 64,
      },
    });
  }
}

async function handleAutocomplete(interaction: DiscordInteraction): Promise<Response> {
  const choices = await handleAutocompleteLogic(interaction);
  return createResponse({
    type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
    data: { choices },
  });
}

async function handleModalSubmit(interaction: DiscordInteraction): Promise<Response> {
  const customId = interaction.data?.custom_id || '';
  console.log(`[Discord] Modal submit: ${customId}`);

  // Helper function to find a component value by custom_id
  const getComponentValue = (components: any[], targetCustomId: string): string => {
    for (const actionRow of components) {
      if (actionRow?.components) {
        for (const component of actionRow.components) {
          if (component?.custom_id === targetCustomId) {
            return component.value || '';
          }
        }
      }
    }
    return '';
  };

  // Handle rebase
  if (isRebaseExecute(customId)) {
    const values = getComponentValue(interaction.data?.components || [], 'confirm_text');

    if (values !== 'REBASE') {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Rebase cancelled. You did not type "REBASE" correctly.',
          flags: 64,
        },
      });
    }

    const data = parseRebaseData(customId);
    if (!data) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Invalid rebase data.',
          flags: 64,
        },
      });
    }

    return handleRebaseExecute(data.repo, data.prNumber, interaction);
  }

  // Handle create issue
  if (customId.startsWith('gh:create_issue:') && customId.endsWith(':execute')) {
    const parts = customId.split(':');
    const repo = parts[2];
    
    const title = getComponentValue(interaction.data?.components || [], 'issue_title');
    const body = getComponentValue(interaction.data?.components || [], 'issue_body');

    if (!title) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Issue title is required.',
          flags: 64,
        },
      });
    }

    const githubToken = await getGitHubTokenFromInteraction(interaction);
    
    if (!githubToken) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ No GitHub account linked. Please use \`/link\` to connect your GitHub account first.`,
          flags: 64,
        },
      });
    }

    try {
      const result = await createIssue(repo, title, body, githubToken);
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `✅ Issue created: ${result.url}`,
          flags: 64,
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ Failed to create issue: ${errorMessage}`,
          flags: 64,
        },
      });
    }
  }

  // Handle create PR
  if (customId.startsWith('gh:create_pr:') && customId.endsWith(':execute')) {
    const parts = customId.split(':');
    const repo = parts[2];
    const head = parts[3];
    
    const title = getComponentValue(interaction.data?.components || [], 'pr_title');
    const body = getComponentValue(interaction.data?.components || [], 'pr_body');
    const base = getComponentValue(interaction.data?.components || [], 'pr_base') || 'main';

    if (!title) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ PR title is required.',
          flags: 64,
        },
      });
    }

    const githubToken = await getGitHubTokenFromInteraction(interaction);
    
    if (!githubToken) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ No GitHub account linked. Please use \`/link\` to connect your GitHub account first.`,
          flags: 64,
        },
      });
    }

     try {
       const result = await createPullRequest(repo, title, body, head, githubToken, base);
       return createResponse({
         type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
         data: {
           content: `✅ Pull request created: ${result.url}`,
           flags: 64,
         },
       });
     } catch (err: unknown) {
       const errorMessage = err instanceof Error ? err.message : 'Unknown error';
       return createResponse({
         type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
         data: {
           content: `❌ Failed to create PR: ${errorMessage}`,
           flags: 64,
         },
       });
     }
  }

  // Handle merge PR
  if (customId.startsWith('gh:merge:') && customId.endsWith(':execute')) {
    const parts = customId.split(':');
    const repo = parts[2];
    const prNumber = parts[3];
    
    const githubToken = await getGitHubTokenFromInteraction(interaction);
    
    if (!githubToken) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ No GitHub account linked. Please use \`/link\` to connect your GitHub account first.`,
          flags: 64,
        },
      });
    }

    try {
      await mergePullRequest(repo, prNumber, 'merge', githubToken);
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `✅ PR **${repo}#${prNumber}** has been merged!`,
          flags: 64,
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ Failed to merge PR: ${errorMessage}`,
          flags: 64,
        },
      });
    }
  }

  // Handle comment on PR
  if (customId.startsWith('gh:comment:') && customId.endsWith(':execute')) {
    const parts = customId.split(':');
    const repo = parts[2];
    const prNumber = parts[3];
    
    const body = getComponentValue(interaction.data?.components || [], 'comment_body');

    if (!body) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Comment cannot be empty.',
          flags: 64,
        },
      });
    }

    const githubToken = await getGitHubTokenFromInteraction(interaction);
    
    if (!githubToken) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ No GitHub account linked. Please use \`/link\` to connect your GitHub account first.`,
          flags: 64,
        },
      });
    }

    try {
      const result = await addComment(repo, prNumber, body, githubToken);
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `💬 Comment added: ${result.url}`,
          flags: 64,
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ Failed to add comment: ${errorMessage}`,
          flags: 64,
        },
      });
    }
  }

  // Handle comment on Issue
  if (customId.startsWith('gh:comment_issue:') && customId.endsWith(':execute')) {
    const parts = customId.split(':');
    const repo = parts[2];
    const issueNumber = parts[3];
    
    const body = getComponentValue(interaction.data?.components || [], 'comment_body');

    if (!body) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Comment cannot be empty.',
          flags: 64,
        },
      });
    }

    const githubToken = await getGitHubTokenFromInteraction(interaction);
    
    if (!githubToken) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ No GitHub account linked. Please use \`/link\` to connect your GitHub account first.`,
          flags: 64,
        },
      });
    }

    try {
      const result = await addComment(repo, issueNumber, body, githubToken);
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `💬 Comment added: ${result.url}`,
          flags: 64,
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ Failed to add comment: ${errorMessage}`,
          flags: 64,
        },
      });
    }
  }

  return createErrorResponse('✅ Modal submitted successfully!');
}

function handleUnknownType(type: number): Response {
  console.warn(`[Discord] Unhandled interaction type: ${type}`);
  return createResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: `❌ Unhandled interaction type: ${type}` },
  }, 400);
}

async function dispatchInteraction(interaction: DiscordInteraction): Promise<Response> {
  switch (interaction.type) {
    case InteractionType.PING:
      return handlePing();
    case InteractionType.APPLICATION_COMMAND:
      return handleApplicationCommand(interaction);
    case InteractionType.MESSAGE_COMPONENT:
      return handleMessageComponent(interaction);
    case InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE:
      return handleAutocomplete(interaction);
    case InteractionType.MODAL_SUBMIT:
      return handleModalSubmit(interaction);
    default:
      return handleUnknownType(interaction.type);
  }
}

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return new Response('', { status: 200 });
}

export async function POST(request: Request): Promise<Response> {
  const { valid, body } = await verifyDiscordRequest(request);

  if (!valid) {
    console.error('[Discord] Invalid signature');
    return createResponse({ error: 'Invalid request signature' }, 401);
  }

  console.log('[Discord] Signature verified successfully');

  const interaction = JSON.parse(body) as DiscordInteraction;
  console.log(`[Discord] Received interaction type: ${interaction.type}`);

  return dispatchInteraction(interaction);
}