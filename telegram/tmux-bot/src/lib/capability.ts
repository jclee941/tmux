import type { Api } from "grammy";

/**
 * Whether a chat lets the bot delete the *user's* own input messages.
 *
 * Telegram rule: a bot may delete a user-authored message ONLY in a group/
 * supergroup where it is an admin with `can_delete_messages`. In a private
 * (1:1) chat this is impossible — the bot can only delete its OWN messages.
 *
 * Cached per chat; re-checked on demand after a delete failure downgrades it.
 */
const cache = new Map<number, boolean>();

export async function canDeleteUserMessages(
  api: Api,
  chatId: number,
  chatType: string,
  botId: number,
): Promise<boolean> {
  if (chatType === "private") return false;

  const cached = cache.get(chatId);
  if (cached !== undefined) return cached;

  let ok = false;
  try {
    const member = await api.getChatMember(chatId, botId);
    ok =
      member.status === "administrator" &&
      member.can_delete_messages === true;
  } catch {
    ok = false;
  }
  cache.set(chatId, ok);
  return ok;
}

/** Force a re-check next time (e.g. after a deleteMessage failure). */
export function invalidateCapability(chatId: number): void {
  cache.delete(chatId);
}
