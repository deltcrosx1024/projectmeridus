// Discord API types for interaction handling
// Based on Discord API v10

export interface DiscordCommandOption {
  name: string;
  description: string;
  type: number; // 3 = STRING, 4 = INTEGER, 7 = CHANNEL, etc.
  required?: boolean;
  choices?: { name: string; value: string | number }[];
}

export interface DiscordCommand {
  name: string;
  description: string;
  options?: DiscordCommandOption[];
  execute: (interaction: DiscordInteraction) => Promise<DiscordCommandResponse>;
}

export interface DiscordCommandResponse {
  content?: string;
  embeds?: DiscordEmbed[];
  ephemeral?: boolean;
  components?: any[];
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  thumbnail?: { url: string };
  image?: { url: string };
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
  author?: { name: string; icon_url?: string; url?: string };
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordInteraction {
  id: string;
  type: number; // 1 = PING, 2 = APPLICATION_COMMAND, 3 = MESSAGE_COMPONENT, 5 = MODAL_SUBMIT
  data?: {
    name: string;
    options?: DiscordInteractionOption[];
    custom_id?: string;
    component_type?: number;
    components?: DiscordModalComponent[]; // For modal submits
    values?: string[]; // For select menus
  };
  member?: {
    user?: {
      id: string;
      username: string;
      avatar?: string;
    };
    permissions?: string;
  };
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
  channel_id?: string;
  guild_id?: string;
  token: string;
  application_id: string;
  version: number;
}

export interface DiscordModalComponent {
  type: number;
  components: DiscordTextInputComponent[];
}

export interface DiscordTextInputComponent {
  type: number;
  custom_id: string;
  value: string;
}

export interface DiscordInteractionOption {
  name: string;
  type: number; // 3 = STRING, 4 = INTEGER, 7 = CHANNEL, etc.
  value: string | number | boolean;
  options?: DiscordInteractionOption[];
  focused?: boolean;
}

// Helper function to extract option values from interaction
export function getOptionValue(
  interaction: DiscordInteraction, 
  optionName: string
): string | number | boolean | undefined {
  return interaction.data?.options?.find(opt => opt.name === optionName)?.value;
}

// Helper function to parse all options into an args object
export function parseOptions(interaction: DiscordInteraction): Record<string, string | number | boolean> {
  const args: Record<string, string | number | boolean> = {};
  const options = interaction.data?.options || [];
  
  for (const opt of options) {
    args[opt.name] = opt.value;
  }
  
  return args;
}

// Discord API interaction types
export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

// Discord API interaction response types
export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
} as const;

// Discord API application command option types
export const ApplicationCommandOptionType = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  MENTIONABLE: 9,
  NUMBER: 10,
  ATTACHMENT: 11,
} as const;

// Common colors for embeds
export const EmbedColors = {
  PRIMARY: 0x3498db,
  SUCCESS: 0x2ecc71,
  ERROR: 0xe74c3c,
  WARNING: 0xf39c12,
  INFO: 0x9b59b6,
  GITHUB: 0x24292e,
  DISCORD: 0x5865F2,
} as const;
