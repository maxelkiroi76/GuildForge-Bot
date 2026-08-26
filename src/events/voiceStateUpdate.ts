import { VoiceState } from 'discord.js';
import { handleVoiceJoin, handleVoiceLeave } from '../services/levelService.js';

export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  const guildId = newState.guild.id || oldState.guild.id;
  const userId = member.id;

  // Joined a voice channel from disconnected state
  if (!oldState.channelId && newState.channelId) {
    // Member joined voice
    handleVoiceJoin(userId, guildId);
  }
  // Left a voice channel to disconnected state
  else if (oldState.channelId && !newState.channelId) {
    // Member left voice
    await handleVoiceLeave(userId, guildId, member, newState.client);
  }
  // Switched channels (still in voice, do not interrupt timer)
}
