import type { TestEventInput } from "@/lib/simulate.functions";

export type TestEventSpec = {
  type: TestEventInput["eventType"];
  label: string;
  amount?: number;
  quantity?: number;
  message?: string | null;
};

export type TestEventGroup = {
  platform: TestEventInput["platform"];
  /** Matches Activity Feed filter section titles. */
  headingKey:
    | "activity.filter.twitch"
    | "activity.filter.kick"
    | "activity.filter.tiktok"
    | "activity.filter.youtube"
    | "activity.filter.x"
    | "activity.filter.streamlabs"
    | "activity.filter.streamelements"
    | "activity.test.group.other";
  icon: string;
  color: string;
  events: TestEventSpec[];
};

/**
 * One synthetic payload per source the ingest allowlist already accepts.
 * Amounts match EventTestPanel / overlay simulators (Twitch 100 bits,
 * YouTube Super Chat $5, TikTok gift $2, Streamlabs $10, StreamElements $5).
 */
export const TEST_EVENT_GROUPS: TestEventGroup[] = [
  {
    platform: "KICK",
    headingKey: "activity.filter.kick",
    icon: "kick",
    color: "#53FC18",
    events: [
      { type: "FOLLOW", label: "Follow" },
      { type: "SUBSCRIPTION", label: "Sub" },
      { type: "GIFT_SUB", label: "Gift Sub" },
      { type: "RAID", label: "Raid" },
    ],
  },
  {
    platform: "TWITCH",
    headingKey: "activity.filter.twitch",
    icon: "twitch",
    color: "#9F77F7",
    events: [
      { type: "FOLLOW", label: "Follow" },
      { type: "SUBSCRIPTION", label: "Sub" },
      { type: "GIFT_SUB", label: "Gift Sub" },
      { type: "BITS", label: "100 Bits", amount: 100, message: "Let's go!" },
      { type: "RAID", label: "Raid" },
    ],
  },
  {
    platform: "YOUTUBE",
    headingKey: "activity.filter.youtube",
    icon: "youtube",
    color: "#FF4444",
    events: [
      { type: "FOLLOW", label: "Subscribe" },
      { type: "SUBSCRIPTION", label: "Membership" },
      { type: "DONATION", label: "Super Chat $5", amount: 5, message: "Keep it up!" },
    ],
  },
  {
    platform: "TIKTOK",
    headingKey: "activity.filter.tiktok",
    icon: "tiktok",
    color: "#2DCCD3",
    events: [
      { type: "FOLLOW", label: "Follow" },
      { type: "DONATION", label: "Gift $2", amount: 2, message: "Keep it up!" },
      { type: "LIKE", label: "Likes / Taps", quantity: 50 },
    ],
  },
  {
    platform: "X",
    headingKey: "activity.filter.x",
    icon: "x",
    color: "#E7E9EA",
    events: [{ type: "FOLLOW", label: "Follower" }],
  },
  {
    platform: "STREAMLABS",
    headingKey: "activity.filter.streamlabs",
    icon: "streamlabs",
    color: "#80F5D2",
    events: [{ type: "DONATION", label: "Donation $10", amount: 10, message: "Keep it up!" }],
  },
  {
    platform: "STREAMELEMENTS",
    headingKey: "activity.filter.streamelements",
    icon: "streamelements",
    color: "#4FC3F7",
    events: [{ type: "DONATION", label: "Tip $5", amount: 5, message: "Keep it up!" }],
  },
  {
    platform: "MANUAL",
    headingKey: "activity.test.group.other",
    icon: "custom",
    color: "#A1A1AA",
    events: [
      { type: "FOLLOW", label: "Custom follow" },
      { type: "SUBSCRIPTION", label: "Custom sub" },
      { type: "GIFT_SUB", label: "Custom gift sub" },
      { type: "BITS", label: "Custom bits", amount: 100, message: "Let's go!" },
      { type: "DONATION", label: "Custom donation $5", amount: 5, message: "Keep it up!" },
      { type: "RAID", label: "Custom raid" },
    ],
  },
];

/** Compact tab labels for the Test Event panel. */
export const TEST_EVENT_TAB_LABEL: Record<TestEventInput["platform"], string> = {
  KICK: "Kick",
  TWITCH: "Twitch",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  X: "X",
  STREAMLABS: "Streamlabs",
  STREAMELEMENTS: "SE",
  MANUAL: "Other",
};
