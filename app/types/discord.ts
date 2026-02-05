export interface DiscordCommand{
    name: string;
    description: string;
    execute: (interaction: any) => Promise<{ content: string; ephimeral?: boolean }>;
}