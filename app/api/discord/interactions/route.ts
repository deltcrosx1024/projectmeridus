import { verifyKey } from 'discord-interactions';
import { commands } from '@/app/lib/discord/commands';
import { 
  DiscordInteraction, 
  InteractionType, 
  InteractionResponseType 
} from '@/app/types/discord';
import { handleAutocomplete as handleAutocompleteLogic } from '@/app/lib/discord/autocomplete';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';

interface CommandResult {
  content?: string;
  embeds?: unknown[];
  components?: unknown[];
  ephemeral?: boolean;
}

/**
 * Execute a rebase via GitHub API
 */
async function executeRebase(repo: string, prNumber: string): Promise<void> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repository format');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  const prResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!prResponse.ok) {
    throw new Error(`Failed to get PR details: ${prResponse.statusText}`);
  }

  const pr = await prResponse.json();

  const updateResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/update-branch`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({ expected_head_sha: pr.head.sha }),
    }
  );

  if (!updateResponse.ok && updateResponse.status !== 202) {
    const error = await updateResponse.json().catch(() => ({ message: updateResponse.statusText }));
    throw new Error(error.message || `Failed to rebase: ${updateResponse.status}`);
  }
}

/**
 * Create a new issue via GitHub API
 */
async function createIssue(repo: string, title: string, body: string): Promise<{ url: string }> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repository format');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to create issue: ${response.status}`);
  }

  const issue = await response.json();
  return { url: issue.html_url };
}

/**
 * Create a new pull request via GitHub API
 */
async function createPullRequest(repo: string, title: string, body: string, head: string, base: string = 'main'): Promise<{ url: string }> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repository format');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, head, base }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to create PR: ${response.status}`);
  }

  const pr = await response.json();
  return { url: pr.html_url };
}

/**
 * Merge a pull request via GitHub API
 */
async function mergePullRequest(repo: string, prNumber: string, method: string = 'merge'): Promise<void> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repository format');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/merge`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ merge_method: method }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to merge PR: ${response.status}`);
  }
}

/**
 * Add a comment to a pull request via GitHub API
 */
async function addComment(repo: string, prNumber: string, body: string): Promise<{ url: string }> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repository format');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to add comment: ${response.status}`);
  }

  const comment = await response.json();
  return { url: comment.html_url };
}

/**
 * Add a comment to an issue via GitHub API
 */
async function addIssueComment(repo: string, issueNumber: string, body: string): Promise<{ url: string }> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repository format');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to add comment: ${response.status}`);
  }

  const comment = await response.json();
  return { url: comment.html_url };
}

/**
 * Close a pull request via GitHub API
 */
async function closePullRequest(repo: string, prNumber: string): Promise<void> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repository format');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: 'closed' }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to close PR: ${response.status}`);
  }
}

/**
 * Close an issue via GitHub API
 */
async function closeIssue(repo: string, issueNumber: string): Promise<void> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repository format');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: 'closed' }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to close issue: ${response.status}`);
  }
}

/**
 * Reopen an issue via GitHub API
 */
async function reopenIssue(repo: string, issueNumber: string): Promise<void> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repository format');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: 'open' }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to reopen issue: ${response.status}`);
  }
}

function createResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createErrorResponse(message: string, status = 200): Response {
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

  if (result.ephemeral) {
    responseData.flags = 64;
  }

  return createResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: responseData,
  });
}

async function verifyDiscordRequest(request: Request): Promise<{ valid: boolean; body: string }> {
  const signature = request.headers.get('x-signature-ed25519') || '';
  const timestamp = request.headers.get('x-signature-timestamp') || '';

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
  const commandName = interaction.data?.name;

  if (!commandName) {
    console.error('[Discord] No command name in interaction data');
    return createErrorResponse('❌ No command name provided.');
  }

  console.log(`[Discord] Executing command: /${commandName}`);

  const command = commands[commandName];

  if (!command) {
    console.warn(`[Discord] Unknown command: ${commandName}`);
    return createErrorResponse(
      `❌ Unknown command: **${commandName}**\nUse **/list** to see available commands.`
    );
  }

  try {
    const result = await command.execute(interaction);
    console.log(`[Discord] Command /${commandName} executed successfully`);
    return buildCommandResponse(result);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Discord] Error executing command ${commandName}:`, err);
    return createErrorResponse(`❌ Error executing command: ${errorMessage}`);
  }
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

function parseCustomId(customId: string, prefix: string): { repo: string; number: string } | null {
  const parts = customId.split(':');
  if (parts.length < 3) return null;
  const repo = parts[2];
  const number = parts[3];
  return { repo, number };
}

function parseCreateIssueData(customId: string): { repo: string } | null {
  const parts = customId.split(':');
  if (parts.length < 3) return null;
  return { repo: parts[2] };
}

function parseCreatePRData(customId: string): { repo: string; branch: string } | null {
  const parts = customId.split(':');
  if (parts.length < 4) return null;
  return { repo: parts[2], branch: parts[3] };
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
  return { repo: parts[2], prNumber: parts[3] };
}

async function handleRebaseExecute(repo: string, prNumber: string): Promise<Response> {
  try {
    await executeRebase(repo, prNumber);
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

function handleMessageComponent(interaction: DiscordInteraction): Response {
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
    const data = parseCustomId(customId, 'gh:merge:');
    if (data) {
      return createMergeModal(data.repo, data.number);
    }
  }

  // Comment on PR button
  if (customId.startsWith('gh:comment:') && !customId.includes(':execute')) {
    const data = parseCustomId(customId, 'gh:comment:');
    if (data) {
      return createCommentModal(data.repo, data.number, false);
    }
  }

  // Comment on Issue button
  if (customId.startsWith('gh:comment_issue:') && !customId.includes(':execute')) {
    const data = parseCustomId(customId, 'gh:comment_issue:');
    if (data) {
      return createCommentModal(data.repo, data.number, true);
    }
  }

  // Close PR - execute directly
  if (customId.startsWith('gh:close_pr:')) {
    const data = parseCustomId(customId, 'gh:close_pr:');
    if (data) {
      return closePRHandler(data.repo, data.number);
    }
  }

  // Close Issue - execute directly
  if (customId.startsWith('gh:close_issue:')) {
    const data = parseCustomId(customId, 'gh:close_issue:');
    if (data) {
      return closeIssueHandler(data.repo, data.number);
    }
  }

  // Reopen Issue - execute directly
  if (customId.startsWith('gh:reopen_issue:')) {
    const data = parseCustomId(customId, 'gh:reopen_issue:');
    if (data) {
      return reopenIssueHandler(data.repo, data.number);
    }
  }

  // Review PR - open GitHub
  if (customId.startsWith('gh:review_pr:')) {
    const data = parseCustomId(customId, 'gh:review_pr:');
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
    const data = parseCustomId(customId, 'gh:reply:');
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

  return createErrorResponse(`✅ You clicked: **${customId}**`);
}

// Handler functions for direct actions
function closePRHandler(repo: string, prNumber: string): Response {
  closePullRequest(repo, prNumber)
    .then(() => {
      console.log(`[Discord] PR ${repo}#${prNumber} closed successfully`);
    })
    .catch((err) => {
      console.error('[Discord] Close PR error:', err);
    });

  return createResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `🚫 Closing PR **${repo}#${prNumber}**...`,
      flags: 64,
    },
  });
}

function closeIssueHandler(repo: string, issueNumber: string): Response {
  closeIssue(repo, issueNumber)
    .then(() => {
      console.log(`[Discord] Issue ${repo}#${issueNumber} closed successfully`);
    })
    .catch((err) => {
      console.error('[Discord] Close issue error:', err);
    });

  return createResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `🚫 Closing issue **${repo}#${issueNumber}**...`,
      flags: 64,
    },
  });
}

function reopenIssueHandler(repo: string, issueNumber: string): Response {
  reopenIssue(repo, issueNumber)
    .then(() => {
      console.log(`[Discord] Issue ${repo}#${issueNumber} reopened successfully`);
    })
    .catch((err) => {
      console.error('[Discord] Reopen issue error:', err);
    });

  return createResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `🔄 Reopening issue **${repo}#${issueNumber}**...`,
      flags: 64,
    },
  });
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

  // Handle rebase
  if (isRebaseExecute(customId)) {
    const values = interaction.data?.components?.[0]?.components?.[0]?.value;

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

    return handleRebaseExecute(data.repo, data.prNumber);
  }

  // Handle create issue
  if (customId.startsWith('gh:create_issue:') && customId.endsWith(':execute')) {
    const parts = customId.split(':');
    const repo = parts[2];
    
    const title = interaction.data?.components?.[0]?.components?.[0]?.value || '';
    const body = interaction.data?.components?.[1]?.components?.[0]?.value || '';

    if (!title) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Issue title is required.',
          flags: 64,
        },
      });
    }

    try {
      const result = await createIssue(repo, title, body);
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
    
    const title = interaction.data?.components?.[0]?.components?.[0]?.value || '';
    const body = interaction.data?.components?.[1]?.components?.[0]?.value || '';
    const base = interaction.data?.components?.[2]?.components?.[0]?.value || 'main';

    if (!title) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ PR title is required.',
          flags: 64,
        },
      });
    }

    try {
      const result = await createPullRequest(repo, title, body, head, base);
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
    
    const title = interaction.data?.components?.[0]?.components?.[0]?.value || '';
    const message = interaction.data?.components?.[1]?.components?.[0]?.value || '';

    try {
      await mergePullRequest(repo, prNumber, 'merge');
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
    
    const body = interaction.data?.components?.[0]?.components?.[0]?.value || '';

    if (!body) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Comment cannot be empty.',
          flags: 64,
        },
      });
    }

    try {
      const result = await addComment(repo, prNumber, body);
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
    
    const body = interaction.data?.components?.[0]?.components?.[0]?.value || '';

    if (!body) {
      return createResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Comment cannot be empty.',
          flags: 64,
        },
      });
    }

    try {
      const result = await addIssueComment(repo, issueNumber, body);
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
  return createResponse(
    { error: `Unhandled interaction type: ${type}` },
    400
  );
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
