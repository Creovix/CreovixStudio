import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TikTokTapGoalView } from "@/components/widgets/WidgetRenderer";
import { useWidgetStream } from "@/hooks/useWidgetStream";
import { OVERLAY_FONT_STYLESHEET } from "@/lib/overlayTheme";

export const Route = createFileRoute("/overlay/tiktok-tap-goal")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  head: () => ({
    meta: [
<<<<<<< HEAD
      { title: "CylixStudio — TikTok Tap Goal (OBS)" },
=======
      { title: "TikTok Tap Goal — OBS Browser Source" },
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
      {
        name: "description",
        content:
          "Transparent OBS browser source showing live TikTok tap progress toward a target with confetti on completion.",
      },
<<<<<<< HEAD
      { property: "og:title", content: "CylixStudio — TikTok Tap Goal (OBS)" },
=======
      { property: "og:title", content: "TikTok Tap Goal — OBS Browser Source" },
>>>>>>> 970f687b11e70c3737c6875891a881ff305d6ca8
      {
        property: "og:description",
        content: "Live TikTok tap goal progress bar overlay for OBS and Streamlabs Desktop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: OVERLAY_FONT_STYLESHEET }],
  }),
  component: TapGoalOverlayPage,
});

function TapGoalOverlayPage() {
  const { token } = Route.useSearch();
  const { widget, tapGoal } = useWidgetStream(token.trim().length > 0 ? token.trim() : null);

  // OBS composites the page over the scene, so nothing may paint a background.
  useEffect(() => {
    document.body.classList.add("overlay-transparent");
    const previousHtml = document.documentElement.style.background;
    document.documentElement.style.background = "transparent";
    return () => {
      document.body.classList.remove("overlay-transparent");
      document.documentElement.style.background = previousHtml;
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-transparent p-6">
      {widget ? <TikTokTapGoalView config={widget.config} taps={tapGoal} /> : null}
    </main>
  );
}
