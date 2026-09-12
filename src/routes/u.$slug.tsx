import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { LinkInBioPage } from "@/components/link-in-bio/LinkInBioPage";
import {
  loadTestLinkInBio,
  publicLinkInBioPayload,
  type PublicLinkInBio,
} from "@/lib/linkInBio";
import { isTestMode } from "@/lib/testMode";

export const Route = createFileRoute("/u/$slug")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Creovix` },
      { name: "description", content: "Creator links, streams, and socials." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PublicLinkInBioRoute,
});

function PublicLinkInBioRoute() {
  const { slug } = Route.useParams();
  const [data, setData] = useState<PublicLinkInBio | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      const response = await fetch(`/api/public/link-in-bio/${encodeURIComponent(slug)}/live`, {
        cache: "no-store",
      });
      if (stopped) return;
      if (response.ok) {
        setData((await response.json()) as PublicLinkInBio);
        setMissing(false);
        return;
      }
      if (isTestMode()) {
        const test = loadTestLinkInBio();
        if (test.profile.slug === slug.toLowerCase() && test.profile.published) {
          setData(publicLinkInBioPayload(test));
          setMissing(false);
          return;
        }
      }
      setMissing(true);
    };
    void load();
    return () => {
      stopped = true;
    };
  }, [slug]);

  if (missing) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0f1117] text-zinc-300">
        <p className="text-sm">This page is not published.</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0f1117] text-zinc-500">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }
  return <LinkInBioPage data={data} />;
}
