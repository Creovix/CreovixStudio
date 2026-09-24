import { sendKickChatMessage } from "@/lib/clipCommand.server";
import {
  commandTrigger,
  formatCommandReply,
  matchCustomCommand,
  normalizeTriggerMarker,
  type ChatCommandPlatform,
  type CustomChatCommand,
} from "@/lib/customCommands";
import { supabaseAdmin } from "@/lib/supabase/client.server";

type ChatSender = {
  username: string;
  identityBadges: string[];
};

const cooldowns = new Map<string, number>();

function senderRoles(badges: string[]): Set<string> {
  const roles = new Set<string>(["Everyone"]);
  for (const badge of badges) {
    const type = badge.toLowerCase();
    if (type.includes("moderator") || type.includes("broadcaster")) roles.add("Mods");
    if (type.includes("vip")) roles.add("VIPs");
    if (type.includes("sub") || type.includes("founder")) roles.add("Subs");
  }
  return roles;
}

function isAllowed(command: CustomChatCommand, badges: string[]): boolean {
  if (command.roles.includes("Everyone")) return true;
  const held = senderRoles(badges);
  return command.roles.some((role) => held.has(role));
}

async function loadCommands(userId: string): Promise<{
  defaultPrefix: string;
  commands: CustomChatCommand[];
}> {
  const [{ data: settings }, { data: rows }] = await Promise.all([
    supabaseAdmin
      .from("custom_chat_command_settings")
      .select("default_prefix")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("custom_chat_commands")
      .select(
        "id, name, prefix, response, enabled, platforms, roles, cooldown_seconds, created_at, updated_at",
      )
      .eq("user_id", userId)
      .eq("enabled", true),
  ]);

  return {
    defaultPrefix: normalizeTriggerMarker(settings?.default_prefix ?? "!"),
    commands: (rows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix === null ? null : normalizeTriggerMarker(row.prefix),
      response: row.response,
      enabled: row.enabled,
      platforms: (row.platforms ?? []).filter(
        (platform): platform is ChatCommandPlatform => platform === "KICK" || platform === "TWITCH",
      ),
      roles: row.roles?.length ? row.roles : ["Everyone"],
      cooldownSeconds: row.cooldown_seconds,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

export async function handleCustomChatCommand(input: {
  userId: string;
  broadcasterUserId: string;
  platform: ChatCommandPlatform;
  text: string;
  sender: ChatSender;
}): Promise<{ status: string; reason?: string; command?: string }> {
  const { defaultPrefix, commands } = await loadCommands(input.userId);
  const matched = matchCustomCommand(input.text, commands, defaultPrefix, input.platform);
  if (!matched) return { status: "ignored", reason: "no_match" };
  if (!isAllowed(matched, input.sender.identityBadges)) {
    return { status: "ignored", reason: "not_permitted" };
  }

  if (matched.cooldownSeconds > 0) {
    const key = `${input.userId}:${matched.id}`;
    const last = cooldowns.get(key) ?? 0;
    if (Date.now() - last < matched.cooldownSeconds * 1000) {
      return { status: "ignored", reason: "cooldown" };
    }
    cooldowns.set(key, Date.now());
  }

  const trigger = commandTrigger(matched, defaultPrefix);
  const reply = formatCommandReply(matched.response, {
    user: input.sender.username,
    command: trigger,
  });
  if (!reply) return { status: "ignored", reason: "empty_reply" };

  if (input.platform === "KICK") {
    const sent = await sendKickChatMessage(input.userId, input.broadcasterUserId, reply);
    if (!sent) return { status: "error", reason: "send_failed", command: trigger };
  }

  return { status: "replied", command: trigger };
}
