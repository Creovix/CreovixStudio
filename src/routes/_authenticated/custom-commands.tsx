import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ListFilter, MessageSquareCode, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useLanguage } from "@/lib/i18n";
import {
  COMMAND_ROLES,
  PREFIX_MARKERS,
  QUESTION_SUFFIX,
  commandTrigger,
  isSuffixMarker,
  questionSuffixForText,
  deleteTestCommand,
  emptyCommandDraft,
  formatCommandReply,
  loadTestCommandState,
  matchCustomCommand,
  saveTestCommandSettings,
  setTestCommandEnabled,
  upsertTestCommand,
  type ChatCommandPlatform,
  type CustomChatCommand,
  type CustomChatCommandInput,
} from "@/lib/customCommands";
import {
  deleteCustomCommand,
  getCustomCommandsState,
  saveCustomCommandSettings,
  setCustomCommandEnabled as persistCommandEnabled,
  upsertCustomCommand,
} from "@/lib/customCommands.functions";
import {
  loadTestDefaultCommands,
  mergeDefaultCommands,
  setTestDefaultCommandEnabled,
  upsertTestDefaultCommand,
  type DefaultCommand,
  type DefaultCommandInput,
} from "@/lib/defaultCommands";
import {
  listDefaultCommands,
  setDefaultCommandEnabled,
  upsertDefaultCommand,
} from "@/lib/defaultCommands.functions";
import {
  deleteMessageTimer,
  listMessageTimers,
  setMessageTimerEnabled,
  tickMessageTimers,
  upsertMessageTimer,
} from "@/lib/messageTimers.functions";
import {
  deleteTestTimer,
  emptyTimerDraft,
  loadTestTimers,
  setTestTimerEnabled,
  tickTestTimers,
  upsertTestTimer,
  type MessageTimer,
  type MessageTimerInput,
} from "@/lib/messageTimers";
import { isTestMode } from "@/lib/testMode";
import { PlatformIcon } from "@/components/widgets/PlatformIcon";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/custom-commands")({
  head: () => ({
    meta: [
      { title: "Custom Chat Commands — Creovix Studio" },
      {
        name: "description",
        content:
          "Create custom chat commands with a flexible prefix, auto-replies, platform targeting and enable/disable controls.",
      },
      { property: "og:title", content: "Custom Chat Commands — Creovix Studio" },
      {
        property: "og:description",
        content: "Streamer-owned chat commands with optional prefixes and automatic bot replies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomCommandsPage,
});

const COPY = {
    title: "Custom Chat Commands",
    subtitle: "Create chat triggers and automatic replies for your stream.",
    prefixTitle: "Command trigger",
    prefixHint:
      "Choose how viewers fire commands: a symbol before the word (!hello), a question mark after it (hello? or سؤال؟), or the word alone.",
    none: "No symbol (direct)",
    prefixGroup: "Symbol at the start",
    suffixGroup: "Question mark at the end",
    custom: "Custom symbol",
    savePrefix: "Save trigger",
    add: "Add command",
    empty: "No commands yet. Add one to start auto-replies in chat.",
    name: "Command",
    reply: "Auto-reply",
    platform: "Platforms",
    status: "Status",
    on: "On",
    off: "Off",
    edit: "Edit",
    delete: "Delete",
    modalCreate: "New command",
    modalEdit: "Edit command",
    modalHint: "Viewers type the trigger in chat and the bot sends your reply.",
    nameLabel: "Command name",
    namePlaceholder: "discord",
    prefixLabel: "Where the symbol goes",
    inherit: "Use default",
    prefixAtStart: "Before the word",
    suffixAuto: "Arabic letters use ؟ and English letters use ? automatically.",
    livePreview: "Viewers will type",
    testerPlaceholder: "hello?",
    responseLabel: "Bot reply",
    responsePlaceholder: "Join Discord: discord.gg/your-server",
    vars: "Variables: {user}  {command}",
    platformsLabel: "Platforms",
    rolesLabel: "Who can use it",
    cooldown: "Cooldown (seconds)",
    enabled: "Enabled",
    cancel: "Cancel",
    save: "Save command",
    deleteTitle: "Delete this command?",
    deleteBody: "The chat trigger will stop working immediately.",
    previewTitle: "Trigger preview",
    testerTitle: "Try a chat line",
    testerHint: "Type what a viewer would send. Matching is local and does not post to chat.",
    testerHit: "Would reply",
    testerMiss: "No matching command",
    howTitle: "How it works",
    how: [
      "Pick a start symbol (! or #), an ending question mark (? ؟), or no symbol.",
      "Add a command name and the message the bot should send.",
      "Choose Kick, Twitch, or both, then enable the command.",
    ],
    errName: "Enter a command name.",
    errReply: "Enter a reply message.",
    errDup: "That command name already exists.",
    errSave: "Could not save the command.",
    saved: "Saved",
    prefixSaved: "Default trigger saved",
    search: "Search commands…",
    filters: "Filters",
    filterAll: "All",
    filterDisabled: "Disabled",
    filterNone: "No commands match.",
    loadMore: "Load More",
    tabDefaults: "Default Commands",
    tabCommands: "Custom Commands",
    tabTimers: "Message Timers",
    defaultSubtitle: "Built-in Kick chat commands. Edit the reply — the trigger stays reserved.",
    defaultHint: "Customize the bot reply. The trigger name cannot be changed.",
    defaultVars: "Variables: {user}  {command}  {target}  {list}  {followage}",
    defaultHowTitle: "How it works",
    defaultHow: [
      "These five commands are always listed. Enable the ones you want in Kick chat.",
      "Edit the reply template. The trigger (!commands, !lurk, …) cannot be renamed.",
      "Kick sends the reply. Twitch is stored as a flag only. !clip is never taken.",
    ],
    defaultSave: "Save command",
    fallbackLabel: "Fallback reply",
    errReserved: "That name is reserved for a default command.",
    timerSubtitle: "Repeating Kick chat messages on an interval.",
    addTimer: "Add timer",
    timerEmpty: "No timers yet. Add one to post a repeating Kick chat message.",
    timerModalCreate: "New timer",
    timerModalEdit: "Edit timer",
    timerHint: "The bot posts this message on Kick every N minutes while Studio stays open.",
    timerMessage: "Message",
    timerMessagePlaceholder: "Follow the stream and drink water.",
    timerInterval: "Interval (minutes)",
    timerEveryPrefix: "every",
    timerMinutesUnit: "min",
    timerSave: "Save timer",
    timerDeleteTitle: "Delete this timer?",
    timerDeleteBody: "The repeating message will stop immediately.",
    errTimerMessage: "Enter a message.",
    errTimerSave: "Could not save the timer.",
    timerHowTitle: "How it works",
    timerHow: [
      "Write the message and how often it should post (minutes).",
      "Enable it. The bot sends to Kick while this Studio page is open.",
      "There is no server cron and Twitch is not sent.",
    ],
  } as const;

type CommandsCopy = typeof COPY;

const field =
  "w-full rounded-xl border border-[oklch(1_0_0/0.1)] bg-[oklch(0.14_0.02_265/0.9)] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-[color-mix(in_oklab,var(--primary)_55%,transparent)]";
const pill =
  "rounded-full border px-3 py-1.5 text-[0.78rem] font-medium transition-colors";

const PLATFORMS: { id: ChatCommandPlatform; label: string }[] = [
  { id: "KICK", label: "Kick" },
  { id: "TWITCH", label: "Twitch" },
];

const FACE_GRID = "grid grid-cols-[repeat(auto-fill,190px)] justify-start gap-3";
const FACE_ROW = "flex flex-wrap justify-start gap-3";
const FACE_PAGE_INITIAL = 12;
const FACE_PAGE_STEP = 8;

function useFaceLoadMore(itemCount: number) {
  const [limit, setLimit] = useState(FACE_PAGE_INITIAL);
  useEffect(() => {
    setLimit(FACE_PAGE_INITIAL);
  }, [itemCount]);
  return {
    limit,
    canLoadMore: limit < itemCount,
    loadMore: () => setLimit((current) => current + FACE_PAGE_STEP),
  };
}

function LoadMoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="mt-4 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg px-3 py-1.5 text-[0.82rem] font-medium text-muted-foreground transition-colors hover:bg-zinc-800 hover:text-foreground"
      >
        {label}
      </button>
    </div>
  );
}

type StatusFilter = "all" | "enabled" | "disabled";
type PlatformFilter = "all" | ChatCommandPlatform;

function CustomCommandsPage() {
  const { user } = Route.useRouteContext();
  const { data } = useWorkspace(user.id);
  const { lang } = useLanguage();
  const c = COPY;
  const queryClient = useQueryClient();
  const test = isTestMode();

  const loadState = useServerFn(getCustomCommandsState);
  const persistSettings = useServerFn(saveCustomCommandSettings);
  const persistCommand = useServerFn(upsertCustomCommand);
  const persistEnabled = useServerFn(persistCommandEnabled);
  const persistDelete = useServerFn(deleteCustomCommand);
  const loadTimers = useServerFn(listMessageTimers);
  const persistTimer = useServerFn(upsertMessageTimer);
  const persistTimerEnabled = useServerFn(setMessageTimerEnabled);
  const persistTimerDelete = useServerFn(deleteMessageTimer);
  const persistTimerTick = useServerFn(tickMessageTimers);
  const loadDefaults = useServerFn(listDefaultCommands);
  const persistDefault = useServerFn(upsertDefaultCommand);
  const persistDefaultEnabled = useServerFn(setDefaultCommandEnabled);

  const state = useQuery({
    queryKey: ["custom-commands", user.id],
    queryFn: () => (test ? loadTestCommandState() : loadState()),
  });

  const settings = state.data?.settings ?? { defaultPrefix: "!" };
  const commands = state.data?.commands ?? [];

  const [defaultPrefix, setDefaultPrefix] = useState<string | null>(null);
  const prefixValue = defaultPrefix ?? settings.defaultPrefix;

  const [editor, setEditor] = useState<CustomChatCommandInput | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sample, setSample] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [pageTab, setPageTab] = useState<"defaults" | "commands" | "timers">("defaults");
  const [timerEditor, setTimerEditor] = useState<MessageTimerInput | null>(null);
  const [timerDeleteId, setTimerDeleteId] = useState<string | null>(null);
  const [defaultEditor, setDefaultEditor] = useState<DefaultCommandInput | null>(null);

  const timers = useQuery({
    queryKey: ["message-timers", user.id],
    queryFn: () => (test ? loadTestTimers() : loadTimers()),
  });
  const timerRows = timers.data ?? [];

  const defaultState = useQuery({
    queryKey: ["default-commands", user.id, lang],
    queryFn: async () => {
      if (test) return loadTestDefaultCommands(lang);
      const rows = await loadDefaults();
      return mergeDefaultCommands(rows, lang);
    },
  });
  const defaultRows = defaultState.data ?? [];
  const invalidateDefaults = () =>
    queryClient.invalidateQueries({ queryKey: ["default-commands", user.id] });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["custom-commands", user.id] });
  const invalidateTimers = () => queryClient.invalidateQueries({ queryKey: ["message-timers", user.id] });

  useEffect(() => {
    const run = () => {
      if (test) {
        tickTestTimers();
        return;
      }
      void persistTimerTick();
    };
    run();
    const id = window.setInterval(run, 30_000);
    return () => window.clearInterval(id);
  }, [test, persistTimerTick]);

  const prefixMutation = useMutation({
    mutationFn: async (value: string) => {
      if (test) return saveTestCommandSettings(value);
      const result = await persistSettings({ data: { defaultPrefix: value } });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success(c.prefixSaved);
      void invalidate();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (input: CustomChatCommandInput) => {
      if (test) {
        if (!input.name.trim()) throw new Error("name_required");
        if (!input.response.trim()) throw new Error("response_required");
        return upsertTestCommand(input);
      }
      const result = await persistCommand({ data: input });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success(c.saved);
      setEditor(null);
      void invalidate();
    },
    onError: (error: Error) => {
      toast.error(
        error.message === "name_required"
          ? c.errName
          : error.message === "response_required"
            ? c.errReply
            : error.message === "duplicate_name"
              ? c.errDup
              : error.message === "reserved_name"
                ? c.errReserved
                : c.errSave,
      );
    },
  });

  const enabledMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      if (test) return setTestCommandEnabled(id, enabled);
      return persistEnabled({ data: { id, enabled } });
    },
    onSuccess: () => void invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (test) return deleteTestCommand(id);
      return persistDelete({ data: { id } });
    },
    onSuccess: () => {
      setDeleteId(null);
      void invalidate();
    },
  });

  const sampleHit = useMemo(() => {
    if (!sample.trim()) return null;
    return matchCustomCommand(sample, commands, prefixValue, "KICK")
      ?? matchCustomCommand(sample, commands, prefixValue, "TWITCH");
  }, [sample, commands, prefixValue]);

  const visibleCommands = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return commands.filter((command) => {
      if (statusFilter === "enabled" && !command.enabled) return false;
      if (statusFilter === "disabled" && command.enabled) return false;
      if (platformFilter !== "all" && !command.platforms.includes(platformFilter)) return false;
      if (!needle) return true;
      const trigger = commandTrigger(command, prefixValue).toLowerCase();
      return (
        command.name.toLowerCase().includes(needle) ||
        trigger.includes(needle) ||
        command.response.toLowerCase().includes(needle)
      );
    });
  }, [commands, query, statusFilter, platformFilter, prefixValue]);

  const timerSaveMutation = useMutation({
    mutationFn: async (input: MessageTimerInput) => {
      if (test) {
        if (!input.message.trim()) throw new Error("message_required");
        return upsertTestTimer(input);
      }
      const result = await persistTimer({ data: input });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success(c.saved);
      setTimerEditor(null);
      void invalidateTimers();
    },
    onError: (error: Error) => {
      toast.error(error.message === "message_required" ? c.errTimerMessage : c.errTimerSave);
    },
  });

  const timerEnabledMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      if (test) return setTestTimerEnabled(id, enabled);
      return persistTimerEnabled({ data: { id, enabled } });
    },
    onSuccess: () => void invalidateTimers(),
  });

  const timerDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (test) return deleteTestTimer(id);
      return persistTimerDelete({ data: { id } });
    },
    onSuccess: () => {
      setTimerDeleteId(null);
      void invalidateTimers();
    },
  });

  const defaultSaveMutation = useMutation({
    mutationFn: async (input: DefaultCommandInput) => {
      if (test) {
        if (!input.response.trim()) throw new Error("response_required");
        return upsertTestDefaultCommand(input, lang);
      }
      const result = await persistDefault({ data: input });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success(c.saved);
      setDefaultEditor(null);
      void invalidateDefaults();
    },
    onError: (error: Error) => {
      toast.error(error.message === "response_required" ? c.errReply : c.errSave);
    },
  });

  const defaultEnabledMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: DefaultCommand["id"]; enabled: boolean }) => {
      if (test) return setTestDefaultCommandEnabled(id, enabled, lang);
      return persistDefaultEnabled({ data: { id, enabled } });
    },
    onSuccess: () => void invalidateDefaults(),
  });

  const openCreate = () => setEditor(emptyCommandDraft());
  const openEdit = (command: CustomChatCommand) =>
    setEditor({
      id: command.id,
      name: command.name,
      prefix: command.prefix,
      response: command.response,
      enabled: command.enabled,
      platforms: command.platforms,
      roles: command.roles,
      cooldownSeconds: command.cooldownSeconds,
    });

  return (
    <AppShell
      user={user}
      profile={data?.profile}
      title={pageTab === "defaults" ? c.tabDefaults : pageTab === "timers" ? c.tabTimers : c.title}
      subtitle={
        pageTab === "defaults" ? c.defaultSubtitle : pageTab === "timers" ? c.timerSubtitle : c.subtitle
      }
    >
      <div className="mb-6 flex flex-wrap gap-1">
        {(
          [
            ["defaults", c.tabDefaults],
            ["commands", c.tabCommands],
            ["timers", c.tabTimers],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPageTab(id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[0.82rem] font-medium transition-colors",
              pageTab === id ? "bg-zinc-800 text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {pageTab === "defaults" ? (
        <DefaultCommandsPanel
          copy={c}
          commands={defaultRows}
          onEdit={(command) =>
            setDefaultEditor({
              id: command.id,
              enabled: command.enabled,
              response: command.response,
              fallbackResponse: command.fallbackResponse,
              platforms: command.platforms,
              cooldownSeconds: command.cooldownSeconds,
            })
          }
          onToggle={(id, enabled) => defaultEnabledMutation.mutate({ id, enabled })}
        />
      ) : pageTab === "timers" ? (
        <MessageTimersPanel
          copy={c}
          timers={timerRows}
          onAdd={() => setTimerEditor(emptyTimerDraft())}
          onEdit={(timer) =>
            setTimerEditor({
              id: timer.id,
              message: timer.message,
              intervalMinutes: timer.intervalMinutes,
              enabled: timer.enabled,
              platforms: timer.platforms,
            })
          }
          onDelete={(id) => setTimerDeleteId(id)}
          onToggle={(id, enabled) => timerEnabledMutation.mutate({ id, enabled })}
        />
      ) : (
      <div className="space-y-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative w-44 shrink-0">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={c.search}
                aria-label={c.search}
                className="h-8 w-full rounded-lg border border-zinc-800/60 bg-transparent pe-2.5 ps-8 text-[0.78rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-zinc-600"
                dir="auto"
              />
            </label>
            <CommandFilterMenu
              copy={c}
              statusFilter={statusFilter}
              platformFilter={platformFilter}
              onStatusFilter={setStatusFilter}
              onPlatformFilter={setPlatformFilter}
            />
            <button
              type="button"
              onClick={openCreate}
              className="ms-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-500 px-3 text-[0.78rem] font-semibold text-black transition-opacity hover:opacity-90"
            >
              <Plus className="size-3.5" aria-hidden />
              {c.add}
            </button>
          </div>

          {commands.length === 0 ? (
            <div className="mt-5 grid place-items-center gap-2 py-10 text-center">
              <MessageSquareCode className="size-7 text-muted-foreground" aria-hidden />
              <p className="max-w-sm text-[0.82rem] text-muted-foreground">{c.empty}</p>
            </div>
          ) : visibleCommands.length === 0 ? (
            <p className="mt-4 text-start text-[0.78rem] text-muted-foreground">{c.filterNone}</p>
          ) : (
            <PagedCommandGrid
              commands={visibleCommands}
              defaultPrefix={prefixValue}
              copy={c}
              onToggle={(id, enabled) => enabledMutation.mutate({ id, enabled })}
              onEdit={openEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[0.95rem] font-semibold">{c.prefixTitle}</h2>
                <p className="mt-1 max-w-xl text-[0.78rem] text-muted-foreground">{c.prefixHint}</p>
              </div>
              <button
                type="button"
                onClick={() => prefixMutation.mutate(prefixValue)}
                className="rounded-full bg-emerald-500 px-4 py-2 text-[0.82rem] font-semibold text-black transition-opacity hover:opacity-90"
              >
                {c.savePrefix}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-1.5 text-[0.7rem] uppercase tracking-wide text-muted-foreground">{c.none}</p>
                <button
                  type="button"
                  onClick={() => setDefaultPrefix("")}
                  className={cn(
                    pill,
                    prefixValue === ""
                      ? "border-emerald-500/50 bg-emerald-500/15 text-foreground"
                      : "border-[oklch(1_0_0/0.1)] text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.none}
                </button>
              </div>
              <div>
                <p className="mb-1.5 text-[0.7rem] uppercase tracking-wide text-muted-foreground">{c.prefixGroup}</p>
                <div className="flex flex-wrap gap-2">
                  {PREFIX_MARKERS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDefaultPrefix(preset)}
                      className={cn(
                        pill,
                        "font-mono",
                        prefixValue === preset
                          ? "border-emerald-500/50 bg-emerald-500/15 text-foreground"
                          : "border-[oklch(1_0_0/0.1)] text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {preset}name
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[0.7rem] uppercase tracking-wide text-muted-foreground">{c.suffixGroup}</p>
                <button
                  type="button"
                  onClick={() => setDefaultPrefix(QUESTION_SUFFIX)}
                  className={cn(
                    pill,
                    isSuffixMarker(prefixValue)
                      ? "border-emerald-500/50 bg-emerald-500/15 text-foreground"
                      : "border-[oklch(1_0_0/0.1)] text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="font-mono" dir="ltr">
                    question?
                  </span>
                  <span className="mx-1 text-muted-foreground">/</span>
                  <span className="font-mono">سؤال؟</span>
                </button>
                <p className="mt-1.5 text-[0.72rem] text-muted-foreground">{c.suffixAuto}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-10 lg:border-s lg:border-white/5 lg:ps-8">
          <section>
            <h2 className="text-[0.95rem] font-semibold">{c.howTitle}</h2>
            <ol className="mt-4 space-y-3 text-[0.82rem]">
              {c.how.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-[0.72rem] font-semibold text-emerald-400">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-t border-white/5 pt-8">
            <h2 className="text-[0.95rem] font-semibold">{c.testerTitle}</h2>
            <p className="mt-1 text-[0.78rem] text-muted-foreground">{c.testerHint}</p>
            <input
              value={sample}
              onChange={(event) => setSample(event.target.value)}
              placeholder={c.testerPlaceholder}
              className={`${field} mt-3 font-mono`}
              dir="auto"
            />
            <div className="mt-3 rounded-lg border border-white/5 p-3 font-mono text-[0.78rem]">
              {sampleHit ? (
                <>
                  <p className="text-emerald-400">{c.testerHit}</p>
                  <p className="mt-1 text-muted-foreground">
                    {formatCommandReply(sampleHit.response, {
                      user: "viewer",
                      command: commandTrigger(sampleHit, prefixValue),
                    })}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">{c.testerMiss}</p>
              )}
            </div>
          </section>
        </div>
      </div>
      </div>
      )}

      <DefaultCommandEditor
        copy={c}
        draft={defaultEditor}
        saving={defaultSaveMutation.isPending}
        onClose={() => setDefaultEditor(null)}
        onChange={setDefaultEditor}
        onSave={() => defaultEditor && defaultSaveMutation.mutate(defaultEditor)}
      />

      <CommandEditor
        copy={c}
        defaultPrefix={prefixValue}
        draft={editor}
        saving={saveMutation.isPending}
        onClose={() => setEditor(null)}
        onChange={setEditor}
        onSave={() => editor && saveMutation.mutate(editor)}
      />

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="glass-3d border-[oklch(1_0_0/0.1)]">
          <AlertDialogHeader>
            <AlertDialogTitle>{c.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{c.deleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>{c.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 text-white hover:bg-rose-500/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {c.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TimerEditor
        copy={c}
        draft={timerEditor}
        saving={timerSaveMutation.isPending}
        onClose={() => setTimerEditor(null)}
        onChange={setTimerEditor}
        onSave={() => timerEditor && timerSaveMutation.mutate(timerEditor)}
      />

      <AlertDialog open={Boolean(timerDeleteId)} onOpenChange={(open) => !open && setTimerDeleteId(null)}>
        <AlertDialogContent className="glass-3d border-[oklch(1_0_0/0.1)]">
          <AlertDialogHeader>
            <AlertDialogTitle>{c.timerDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{c.timerDeleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>{c.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 text-white hover:bg-rose-500/90"
              onClick={() => timerDeleteId && timerDeleteMutation.mutate(timerDeleteId)}
            >
              {c.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function CommandFilterMenu({
  copy,
  statusFilter,
  platformFilter,
  onStatusFilter,
  onPlatformFilter,
}: {
  copy: CommandsCopy;
  statusFilter: StatusFilter;
  platformFilter: PlatformFilter;
  onStatusFilter: (value: StatusFilter) => void;
  onPlatformFilter: (value: PlatformFilter) => void;
}) {
  const active = statusFilter !== "all" || platformFilter !== "all";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800/60 px-2.5 text-[0.78rem] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:border-zinc-600"
        >
          <ListFilter className="size-3.5" aria-hidden />
          {copy.filters}
          {active ? <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden /> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44 text-start">
        <DropdownMenuLabel className="text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">
          {copy.status}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={statusFilter}
          onValueChange={(value) => onStatusFilter(value as StatusFilter)}
        >
          <DropdownMenuRadioItem value="all">{copy.filterAll}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="enabled">{copy.enabled}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="disabled">{copy.filterDisabled}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">
          {copy.platform}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={platformFilter}
          onValueChange={(value) => onPlatformFilter(value as PlatformFilter)}
        >
          <DropdownMenuRadioItem value="all">{copy.filterAll}</DropdownMenuRadioItem>
          {PLATFORMS.map((platform) => (
            <DropdownMenuRadioItem key={platform.id} value={platform.id}>
              <span className="inline-flex items-center gap-1.5">
                <PlatformIcon platform={platform.id} size={12} />
                {platform.label}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EnableSwitch({
  enabled,
  onLabel,
  offLabel,
  onToggle,
}: {
  enabled: boolean;
  onLabel: string;
  offLabel: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? onLabel : offLabel}
      onClick={onToggle}
      className={cn(
        "relative h-3.5 w-6 shrink-0 rounded-full transition-colors duration-200",
        enabled ? "bg-emerald-400/25" : "bg-zinc-700/80",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-[2px] size-2.5 rounded-full transition-[inset-inline-start,background-color] duration-200 ease-out",
          enabled ? "start-[0.7rem] bg-white" : "start-[2px] bg-zinc-400",
        )}
      />
    </button>
  );
}

function DefaultCommandsPanel({
  copy,
  commands,
  onEdit,
  onToggle,
}: {
  copy: CommandsCopy;
  commands: DefaultCommand[];
  onEdit: (command: DefaultCommand) => void;
  onToggle: (id: DefaultCommand["id"], enabled: boolean) => void;
}) {
  const page = useFaceLoadMore(commands.length);
  return (
    <div className="space-y-8">
      <div>
        <div className={FACE_ROW}>
          {commands.slice(0, page.limit).map((command) => (
            <StudioFaceCard
              key={command.id}
              enabled={command.enabled}
              onToggle={() => onToggle(command.id, !command.enabled)}
              onLabel={copy.on}
              offLabel={copy.off}
              onEdit={() => onEdit(command)}
              editLabel={copy.edit}
            >
              <h3 className="max-w-full font-mono text-sm font-semibold tracking-tight text-zinc-100" dir="auto">
                {command.trigger}
              </h3>
            </StudioFaceCard>
          ))}
        </div>
        {page.canLoadMore ? <LoadMoreButton label={copy.loadMore} onClick={page.loadMore} /> : null}
      </div>

      <section>
        <h2 className="text-[0.95rem] font-semibold">{copy.defaultHowTitle}</h2>
        <ol className="mt-4 space-y-3 text-[0.82rem]">
          {copy.defaultHow.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-800 text-[0.72rem] font-semibold text-zinc-300">
                {index + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function DefaultCommandEditor({
  copy,
  draft,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  copy: CommandsCopy;
  draft: DefaultCommandInput | null;
  saving: boolean;
  onClose: () => void;
  onChange: (next: DefaultCommandInput) => void;
  onSave: () => void;
}) {
  if (!draft) return null;
  const showFallback = draft.id === "followage" || draft.id === "so";
  const trigger = `!${draft.id}`;

  const togglePlatform = (platform: ChatCommandPlatform) => {
    const has = draft.platforms.includes(platform);
    const next = has ? draft.platforms.filter((item) => item !== platform) : [...draft.platforms, platform];
    onChange({ ...draft, platforms: next.length ? next : [platform] });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-3d max-h-[90vh] overflow-y-auto border-[oklch(1_0_0/0.1)] sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pe-10">
            <DialogTitle className="min-w-0">{copy.modalEdit}</DialogTitle>
            <div className="flex shrink-0 items-center gap-2 text-[0.82rem]">
              <span className="text-muted-foreground">{copy.enabled}</span>
              <EnableSwitch
                enabled={draft.enabled}
                onLabel={copy.on}
                offLabel={copy.off}
                onToggle={() => onChange({ ...draft, enabled: !draft.enabled })}
              />
            </div>
          </div>
          <DialogDescription>{copy.defaultHint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.nameLabel}
            </span>
            <input value={trigger} readOnly className={`${field} cursor-not-allowed opacity-80`} dir="ltr" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.responseLabel}
            </span>
            <textarea
              value={draft.response}
              onChange={(event) => onChange({ ...draft, response: event.target.value.slice(0, 480) })}
              rows={4}
              className={`${field} resize-y`}
              dir="auto"
            />
            <span className="mt-1.5 block text-[0.72rem] text-muted-foreground">{copy.defaultVars}</span>
          </label>

          {showFallback ? (
            <label className="block">
              <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
                {copy.fallbackLabel}
              </span>
              <textarea
                value={draft.fallbackResponse}
                onChange={(event) =>
                  onChange({ ...draft, fallbackResponse: event.target.value.slice(0, 480) })
                }
                rows={3}
                className={`${field} resize-y`}
                dir="auto"
              />
            </label>
          ) : null}

          <div>
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.platformsLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const active = draft.platforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      pill,
                      "inline-flex items-center gap-2",
                      active
                        ? "border-emerald-500/50 bg-emerald-500/15"
                        : "border-[oklch(1_0_0/0.1)] text-muted-foreground",
                    )}
                  >
                    <PlatformIcon platform={platform.id} size={14} />
                    {platform.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.cooldown}
            </span>
            <input
              type="number"
              min={0}
              max={3600}
              value={draft.cooldownSeconds}
              onChange={(event) =>
                onChange({ ...draft, cooldownSeconds: Number(event.target.value) || 0 })
              }
              className={`${field} w-28`}
              dir="ltr"
            />
          </label>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[oklch(1_0_0/0.12)] px-4 py-2 text-[0.82rem]"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full bg-emerald-500 px-4 py-2 text-[0.82rem] font-semibold text-black disabled:opacity-60"
          >
            {copy.defaultSave}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessageTimersPanel({
  copy,
  timers,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}: {
  copy: CommandsCopy;
  timers: MessageTimer[];
  onAdd: () => void;
  onEdit: (timer: MessageTimer) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const page = useFaceLoadMore(timers.length);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-500 px-3 text-[0.78rem] font-semibold text-black transition-opacity hover:opacity-90"
        >
          <Plus className="size-3.5" aria-hidden />
          {copy.addTimer}
        </button>
      </div>

      {timers.length === 0 ? (
        <p className="text-start text-[0.82rem] text-muted-foreground">{copy.timerEmpty}</p>
      ) : (
        <div>
        <div className={FACE_GRID}>
          {timers.slice(0, page.limit).map((timer) => (
            <StudioFaceCard
              key={timer.id}
              enabled={timer.enabled}
              onToggle={() => onToggle(timer.id, !timer.enabled)}
              onLabel={copy.on}
              offLabel={copy.off}
              onEdit={() => onEdit(timer)}
              onDelete={() => onDelete(timer.id)}
              editLabel={copy.edit}
              deleteLabel={copy.delete}
            >
              <p
                className="line-clamp-2 max-w-full text-[0.78rem] font-medium leading-snug text-zinc-100"
                dir="auto"
              >
                {timer.message}
              </p>
              <p className="mt-1 text-[0.68rem] text-zinc-500">
                {copy.timerEveryPrefix} {timer.intervalMinutes} {copy.timerMinutesUnit}
              </p>
            </StudioFaceCard>
          ))}
        </div>
        {page.canLoadMore ? <LoadMoreButton label={copy.loadMore} onClick={page.loadMore} /> : null}
        </div>
      )}

      <section>
        <h2 className="text-[0.95rem] font-semibold">{copy.timerHowTitle}</h2>
        <ol className="mt-4 space-y-3 text-[0.82rem]">
          {copy.timerHow.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-800 text-[0.72rem] font-semibold text-zinc-300">
                {index + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function TimerEditor({
  copy,
  draft,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  copy: CommandsCopy;
  draft: MessageTimerInput | null;
  saving: boolean;
  onClose: () => void;
  onChange: (next: MessageTimerInput) => void;
  onSave: () => void;
}) {
  if (!draft) return null;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-3d max-h-[90vh] overflow-y-auto border-[oklch(1_0_0/0.1)] sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pe-10">
            <DialogTitle className="min-w-0">
              {draft.id ? copy.timerModalEdit : copy.timerModalCreate}
            </DialogTitle>
            <div className="flex shrink-0 items-center gap-2 text-[0.82rem]">
              <span className="text-muted-foreground">{copy.enabled}</span>
              <EnableSwitch
                enabled={draft.enabled}
                onLabel={copy.on}
                offLabel={copy.off}
                onToggle={() => onChange({ ...draft, enabled: !draft.enabled })}
              />
            </div>
          </div>
          <DialogDescription>{copy.timerHint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.timerMessage}
            </span>
            <textarea
              value={draft.message}
              onChange={(event) => onChange({ ...draft, message: event.target.value.slice(0, 480) })}
              placeholder={copy.timerMessagePlaceholder}
              rows={4}
              className={`${field} resize-y`}
              dir="auto"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.timerInterval}
            </span>
            <input
              type="number"
              min={1}
              max={1440}
              value={draft.intervalMinutes}
              onChange={(event) =>
                onChange({ ...draft, intervalMinutes: Number(event.target.value) || 15 })
              }
              className={`${field} w-28`}
              dir="ltr"
            />
          </label>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[oklch(1_0_0/0.12)] px-4 py-2 text-[0.82rem]"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full bg-emerald-500 px-4 py-2 text-[0.82rem] font-semibold text-black disabled:opacity-60"
          >
            {copy.timerSave}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudioFaceCard({
  enabled,
  onToggle,
  onLabel,
  offLabel,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  children,
}: {
  enabled: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
  onEdit: () => void;
  onDelete?: () => void;
  editLabel: string;
  deleteLabel?: string;
  children: ReactNode;
}) {
  return (
    <article
      className="group relative h-[95px] w-[190px] shrink-0 overflow-hidden rounded-[20px] border border-white/[0.06]"
      style={{ backgroundColor: "#101114" }}
    >
      <span
        role="switch"
        tabIndex={0}
        aria-checked={enabled}
        aria-label={enabled ? onLabel : offLabel}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        className={
          enabled
            ? "absolute top-2 left-1/2 z-20 box-border block h-2 w-2 -translate-x-1/2 rounded-full bg-emerald-600 p-0 leading-none"
            : "absolute top-2 left-1/2 z-20 box-border block h-2 w-2 -translate-x-1/2 rounded-full bg-zinc-600 p-0 leading-none"
        }
      />

      <div className="flex h-full items-center justify-center px-3 text-center transition duration-200 ease-out group-hover:blur-sm group-focus-within:blur-sm">
        {children}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[20px] bg-black/45 opacity-0 transition-opacity duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={editLabel}
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1 text-[0.72rem] font-medium text-zinc-200"
          >
            <Pencil className="size-3.5" aria-hidden />
            {editLabel}
          </button>
          {onDelete && deleteLabel ? (
            <button
              type="button"
              aria-label={deleteLabel}
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-md bg-red-950/70 px-2.5 py-1 text-[0.72rem] font-medium text-red-300/90"
            >
              <Trash2 className="size-3.5" aria-hidden />
              {deleteLabel}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function PagedCommandGrid({
  commands,
  defaultPrefix,
  copy,
  onToggle,
  onEdit,
  onDelete,
}: {
  commands: CustomChatCommand[];
  defaultPrefix: string;
  copy: CommandsCopy;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (command: CustomChatCommand) => void;
  onDelete: (id: string) => void;
}) {
  const page = useFaceLoadMore(commands.length);
  return (
    <div className="mt-3">
      <div className={FACE_GRID}>
        {commands.slice(0, page.limit).map((command) => (
          <CommandCard
            key={command.id}
            command={command}
            defaultPrefix={defaultPrefix}
            copy={copy}
            onToggle={() => onToggle(command.id, !command.enabled)}
            onEdit={() => onEdit(command)}
            onDelete={() => onDelete(command.id)}
          />
        ))}
      </div>
      {page.canLoadMore ? <LoadMoreButton label={copy.loadMore} onClick={page.loadMore} /> : null}
    </div>
  );
}

function CommandCard({
  command,
  defaultPrefix,
  copy,
  onToggle,
  onEdit,
  onDelete,
}: {
  command: CustomChatCommand;
  defaultPrefix: string;
  copy: CommandsCopy;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <StudioFaceCard
      enabled={command.enabled}
      onToggle={onToggle}
      onLabel={copy.on}
      offLabel={copy.off}
      onEdit={onEdit}
      onDelete={onDelete}
      editLabel={copy.edit}
      deleteLabel={copy.delete}
    >
      <h3
        className="max-w-full font-mono text-sm font-semibold tracking-tight text-zinc-100 [overflow-wrap:anywhere]"
        dir="auto"
      >
        {commandTrigger(command, defaultPrefix)}
      </h3>
    </StudioFaceCard>
  );
}

function CommandEditor({
  copy,
  defaultPrefix,
  draft,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  copy: CommandsCopy;
  defaultPrefix: string;
  draft: CustomChatCommandInput | null;
  saving: boolean;
  onClose: () => void;
  onChange: (next: CustomChatCommandInput) => void;
  onSave: () => void;
}) {
  if (!draft) return null;
  const trigger = commandTrigger({ name: draft.name || "name", prefix: draft.prefix }, defaultPrefix);
  const preview = formatCommandReply(draft.response || "…", { user: "viewer", command: trigger });
  const prefixMode = draft.prefix === null ? "inherit" : draft.prefix === "" ? "none" : "custom";
  const suffixSelected = draft.prefix !== null && isSuffixMarker(draft.prefix);
  const liveName = draft.name.trim() || "name";
  const liveSuffix = questionSuffixForText(liveName);

  const togglePlatform = (platform: ChatCommandPlatform) => {
    const has = draft.platforms.includes(platform);
    const next = has ? draft.platforms.filter((item) => item !== platform) : [...draft.platforms, platform];
    onChange({ ...draft, platforms: next.length ? next : [platform] });
  };

  const toggleRole = (role: string) => {
    const has = draft.roles.includes(role);
    const next = has ? draft.roles.filter((item) => item !== role) : [...draft.roles, role];
    onChange({ ...draft, roles: next.length ? next : ["Everyone"] });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-3d max-h-[90vh] overflow-y-auto border-[oklch(1_0_0/0.1)] sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pe-10">
            <DialogTitle className="min-w-0">{draft.id ? copy.modalEdit : copy.modalCreate}</DialogTitle>
            <div className="flex shrink-0 items-center gap-2 text-[0.82rem]">
              <span className="text-muted-foreground">{copy.enabled}</span>
              <EnableSwitch
                enabled={draft.enabled}
                onLabel={copy.on}
                offLabel={copy.off}
                onToggle={() => onChange({ ...draft, enabled: !draft.enabled })}
              />
            </div>
          </div>
          <DialogDescription>{copy.modalHint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.nameLabel}
            </span>
            <input
              value={draft.name}
              onChange={(event) => {
                const name = event.target.value;
                const prefix =
                  draft.prefix !== null && isSuffixMarker(draft.prefix)
                    ? questionSuffixForText(name)
                    : draft.prefix;
                onChange({ ...draft, name, prefix });
              }}
              placeholder={copy.namePlaceholder}
              className={field}
              dir="auto"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.prefixLabel}
            </span>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...draft, prefix: null })}
                  className={cn(
                    pill,
                    prefixMode === "inherit"
                      ? "border-emerald-500/50 bg-emerald-500/15"
                      : "border-[oklch(1_0_0/0.1)] text-muted-foreground",
                  )}
                >
                  {copy.inherit} (
                  <span className="font-mono" dir="ltr">
                    {commandTrigger({ name: draft.name || "name", prefix: null }, defaultPrefix)}
                  </span>
                  )
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...draft, prefix: "" })}
                  className={cn(
                    pill,
                    prefixMode === "none"
                      ? "border-emerald-500/50 bg-emerald-500/15"
                      : "border-[oklch(1_0_0/0.1)] text-muted-foreground",
                  )}
                >
                  {copy.none}
                </button>
              </div>
              <div>
                <p className="mb-1.5 text-[0.7rem] text-muted-foreground">{copy.prefixAtStart}</p>
                <div className="flex flex-wrap gap-2">
                  {PREFIX_MARKERS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onChange({ ...draft, prefix: preset })}
                      className={cn(
                        pill,
                        "font-mono",
                        draft.prefix === preset
                          ? "border-emerald-500/50 bg-emerald-500/15"
                          : "border-[oklch(1_0_0/0.1)] text-muted-foreground",
                      )}
                    >
                      {preset}
                      {draft.name || "name"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[0.7rem] text-muted-foreground">{copy.suffixGroup}</p>
                <button
                  type="button"
                  onClick={() => onChange({ ...draft, prefix: questionSuffixForText(liveName) })}
                  className={cn(
                    pill,
                    suffixSelected
                      ? "border-emerald-500/50 bg-emerald-500/15"
                      : "border-[oklch(1_0_0/0.1)] text-muted-foreground",
                  )}
                >
                  <span className="font-mono" dir="auto">
                    {liveName}
                    {liveSuffix}
                  </span>
                </button>
                <p className="mt-1.5 text-[0.72rem] text-muted-foreground">{copy.suffixAuto}</p>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.responseLabel}
            </span>
            <textarea
              value={draft.response}
              onChange={(event) => onChange({ ...draft, response: event.target.value.slice(0, 480) })}
              placeholder={copy.responsePlaceholder}
              rows={4}
              className={`${field} resize-y`}
            />
            <span className="mt-1.5 block text-[0.72rem] text-muted-foreground">{copy.vars}</span>
          </label>

          <div>
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.platformsLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const active = draft.platforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      pill,
                      "inline-flex items-center gap-2",
                      active
                        ? "border-emerald-500/50 bg-emerald-500/15"
                        : "border-[oklch(1_0_0/0.1)] text-muted-foreground",
                    )}
                  >
                    <PlatformIcon platform={platform.id} size={14} />
                    {platform.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.rolesLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {COMMAND_ROLES.map((role) => {
                const active = draft.roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={cn(
                      pill,
                      active
                        ? "border-emerald-500/50 bg-emerald-500/15"
                        : "border-[oklch(1_0_0/0.1)] text-muted-foreground",
                    )}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">
              {copy.cooldown}
            </span>
            <input
              type="number"
              min={0}
              max={3600}
              value={draft.cooldownSeconds}
              onChange={(event) =>
                onChange({ ...draft, cooldownSeconds: Number(event.target.value) || 0 })
              }
              className={`${field} w-28`}
              dir="ltr"
            />
          </label>

          <div className="rounded-lg border border-[oklch(1_0_0/0.08)] bg-[oklch(0_0_0/0.4)] p-3 text-[0.78rem]">
            <p className="text-muted-foreground">{copy.livePreview}</p>
            <p className="mt-1 font-mono text-lg text-primary" dir="auto">
              {trigger}
            </p>
            {suffixSelected || (draft.prefix === null && isSuffixMarker(defaultPrefix)) ? (
              <p className="mt-1.5 text-[0.72rem] text-muted-foreground">{copy.suffixAuto}</p>
            ) : null}
            <p className="mt-2 font-mono">
              <span className="text-emerald-400">CreovixStudio:</span>{" "}
              <span className="text-muted-foreground" dir="auto">{preview}</span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[oklch(1_0_0/0.12)] px-4 py-2 text-[0.82rem]"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full bg-emerald-500 px-4 py-2 text-[0.82rem] font-semibold text-black disabled:opacity-60"
          >
            {copy.save}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
