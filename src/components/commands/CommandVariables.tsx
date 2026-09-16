import { cn } from "@/lib/utils";

export type CommandVariableGroup = {
  id: string;
  label: string;
  description: string;
  tags: readonly string[];
};

export const COMMAND_VARIABLE_GROUPS: readonly CommandVariableGroup[] = [
  {
    id: "sender",
    label: "SENDER",
    description: "The viewer who typed the command.",
    tags: ["{{sender.username}}", "{{sender.followers}}", "{{sender.followage}}", "{{sender.url}}"],
  },
  {
    id: "streamer",
    label: "STREAMER",
    description: "The channel the command ran in.",
    tags: ["{{streamer.username}}", "{{streamer.followers}}", "{{streamer.url}}"],
  },
  {
    id: "param",
    label: "TAGGED USER / PARAM",
    description: "Argument after the command, or an @mentioned user.",
    tags: ["{{param}}", "{{taggedUser.username}}", "{{taggedUser.followers}}", "{{taggedUser.followage}}"],
  },
  {
    id: "stream",
    label: "STREAM",
    description: "Live stream info when the platform provides it.",
    tags: ["{{stream.title}}", "{{stream.category}}", "{{stream.viewers}}"],
  },
  {
    id: "random",
    label: "RANDOM",
    description: "Pick a number range or one of the listed items.",
    tags: ['{{randomRange(1,100)}}', '{{randomItem("a","b","c")}}'],
  },
  {
    id: "api",
    label: "API REQUEST",
    description: "Fetch a value from a URL when the engine supports it.",
    tags: ['{{request("https://api.example.com").value}}'],
  },
];

/** Tags the reply engine already interpolates today. */
export const LIVE_COMMAND_INTERPOLATORS = ["{user}", "{command}"] as const;

export function CommandVariablesSidebar({
  onInsert,
  className,
}: {
  onInsert: (tag: string) => void;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "w-full shrink-0 space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:w-64",
        className,
      )}
    >
      <p className="text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground">Variables</p>
      <div className="space-y-1.5">
        <p className="text-[0.68rem] text-muted-foreground">Live now</p>
        <div className="flex flex-wrap gap-1">
          {LIVE_COMMAND_INTERPOLATORS.map((tag) => (
            <VariableTag key={tag} tag={tag} onInsert={onInsert} />
          ))}
        </div>
      </div>
      {COMMAND_VARIABLE_GROUPS.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <p className="text-[0.68rem] font-semibold tracking-wide text-zinc-300">{group.label}</p>
          <p className="text-[0.68rem] leading-snug text-muted-foreground">{group.description}</p>
          <div className="flex flex-wrap gap-1">
            {group.tags.map((tag) => (
              <VariableTag key={tag} tag={tag} onInsert={onInsert} />
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

function VariableTag({ tag, onInsert }: { tag: string; onInsert: (tag: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onInsert(tag)}
      className="max-w-full truncate rounded-md border border-white/[0.08] bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[0.62rem] text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-foreground"
      title={tag}
    >
      {tag}
    </button>
  );
}
