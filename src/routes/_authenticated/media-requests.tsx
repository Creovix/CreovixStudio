import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clipboard, ExternalLink, Loader2, Pause, Play, Plus, RefreshCw, Save, Settings2, SkipForward, Trash2, Volume2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DarkSelect } from "@/components/ui/dark-select";
import { supabase } from "@/integrations/supabase/client";
import { useLiveChat } from "@/hooks/useLiveChat";
import { MediaPlayerCard } from "@/components/media/MediaPlayerLayouts";
import { isPlayerLayout, PLAYER_LAYOUT_OPTIONS, type PlayerLayout } from "@/lib/playerPalette";
import { addManualMediaRequest, createKickMediaRewardFn, getMediaChatSources, getMediaRequestDashboard, ingestChatMediaRequestFn, listKickRewardsFn, mediaRequestAction, saveMediaRequestSettings } from "@/lib/mediaRequests.functions";

/** Watches Kick chat for channel-point redemption messages carrying a YouTube link. */
function useChatMediaRequests(enabled:boolean){
  const qc=useQueryClient();
  const ingestChatMessage=useServerFn(ingestChatMediaRequestFn);
  const sources=useQuery({queryKey:["media-chat-sources"],queryFn:()=>getMediaChatSources(),staleTime:300_000,enabled});
  const chat=useMemo(()=>sources.data?{twitchChannel:null,kickChatroomId:sources.data.kickChatroomId,kickSlug:sources.data.kickSlug}:null,[sources.data]);
  const seen=useRef<Set<string>>(new Set());
  const handleMessage=useCallback((m:Parameters<NonNullable<Parameters<typeof useLiveChat>[2]>>[0])=>{
    if(!enabled||m.platform!=="KICK"||seen.current.has(m.id))return;
    const text=m.text??"";
    const match=text.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s"'<>]+/i);
    if(!match)return;
    seen.current.add(m.id);
    // Direct fallback while this page is open; server webhooks handle it in
    // the background even when the dashboard is closed.
    void ingestChatMessage({data:{messageId:m.id,username:m.author,text:match[0]}})
      .then(r=>{if(r.ok)void qc.invalidateQueries({queryKey:["media-requests"]});else seen.current.delete(m.id)})
      .catch(()=>seen.current.delete(m.id));
  },[enabled,ingestChatMessage,qc]);
  useLiveChat(chat,50,handleMessage);
}


/** Listens to the embedded YouTube player and auto-advances when a video ends. */
function usePlayerAutoAdvance(frame:React.RefObject<HTMLIFrameElement|null>,currentId:string|null,onEnded:(id:string)=>void){
  const fired=useRef<string|null>(null);
  const handler=useRef(onEnded);handler.current=onEnded;
  useEffect(()=>{
    if(!currentId)return;
    const handshake=window.setInterval(()=>frame.current?.contentWindow?.postMessage(JSON.stringify({event:"listening",id:currentId}),"https://www.youtube.com"),1000);
    const onMessage=(event:MessageEvent)=>{
      if(!String(event.origin).includes("youtube.com"))return;
      let payload:{info?:unknown};
      try{payload=typeof event.data==="string"?JSON.parse(event.data):event.data as {info?:unknown}}catch{return}
      const info=payload?.info;
      const state=typeof info==="number"?info:(info&&typeof info==="object"?(info as {playerState?:number}).playerState:undefined);
      if(state!==0||fired.current===currentId)return;
      fired.current=currentId;
      handler.current(currentId);
    };
    window.addEventListener("message",onMessage);
    return()=>{window.clearInterval(handshake);window.removeEventListener("message",onMessage)};
  },[currentId,frame]);
}

/** Mirrors pause/resume + volume state onto the embedded YouTube player. */
function usePlayerCommands(frame:React.RefObject<HTMLIFrameElement|null>,currentId:string|null,status:string|undefined,volume:number){
  const send=(func:string,args:unknown[]=[])=>frame.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func,args}),"https://www.youtube.com");
  useEffect(()=>{
    if(!currentId)return;
    const t=window.setTimeout(()=>send(status==="PAUSED"?"pauseVideo":"playVideo"),300);
    return()=>window.clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[currentId,status]);
  useEffect(()=>{
    if(!currentId)return;
    const t=window.setTimeout(()=>{send("unMute");send("setVolume",[Math.max(0,Math.min(100,volume))])},300);
    return()=>window.clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[currentId,volume]);
}

type Req=Awaited<ReturnType<typeof getMediaRequestDashboard>>["requests"][number];
const glass="rounded-2xl border border-white/10 bg-[#10131b]/85 shadow-[0_18px_60px_rgba(0,0,0,.35)] backdrop-blur-xl";
const fmt=(s:number)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
export const Route=createFileRoute("/_authenticated/media-requests")({component:Page});
function Page(){const{user}=Route.useRouteContext();const qc=useQueryClient();const query=useQuery({queryKey:["media-requests"],queryFn:()=>getMediaRequestDashboard()});const d=query.data;const settings=d?.settings as (NonNullable<typeof query.data>["settings"]&{player_layout?:string})|null|undefined;
  const[form,setForm]=useState({kickRewardId:"",requestMode:"MANUAL" as "AUTO"|"MANUAL"|"PAUSED",keywordBlacklist:"",userBlacklist:"",displayMode:"VIDEO" as "VIDEO"|"AUDIO_ONLY",playerLayout:"VERTICAL_CARD" as PlayerLayout,volume:80});
  const[setupTab,setSetupTab]=useState<"setup"|"links"|"safety">("setup");
  useEffect(()=>{if(settings)setForm({kickRewardId:settings.kick_reward_id??"",requestMode:(["AUTO","MANUAL","PAUSED"].includes(settings.request_mode)?settings.request_mode:settings.require_approval?"MANUAL":"AUTO") as "AUTO"|"MANUAL"|"PAUSED",keywordBlacklist:settings.keyword_blacklist.join(", "),userBlacklist:settings.user_blacklist.join(", "),displayMode:settings.display_mode==="AUDIO_ONLY"?"AUDIO_ONLY":"VIDEO",playerLayout:isPlayerLayout(settings.player_layout)?settings.player_layout:"VERTICAL_CARD",volume:settings.volume})},[settings]);
 useEffect(()=>{const refresh=()=>void qc.invalidateQueries({queryKey:["media-requests"]});const channel=supabase.channel(`media:${user.id}`).on("postgres_changes",{event:"*",schema:"public",table:"media_requests",filter:`user_id=eq.${user.id}`},refresh).on("postgres_changes",{event:"*",schema:"public",table:"media_playback_state",filter:`user_id=eq.${user.id}`},refresh).subscribe(status=>{console.log("Media Requests Realtime Status:",status);if(status==="SUBSCRIBED")refresh()});const fallback=window.setInterval(refresh,5000);return()=>{window.clearInterval(fallback);void supabase.removeChannel(channel)}},[qc,user.id]);
 const save=useMutation({mutationFn:()=>saveMediaRequestSettings({data:form}),onSuccess:()=>void qc.invalidateQueries({queryKey:["media-requests"]})});const act=useMutation({mutationFn:(v:Parameters<typeof mediaRequestAction>[0]["data"])=>mediaRequestAction({data:v}),onSuccess:()=>void qc.invalidateQueries({queryKey:["media-requests"]})});
 const requests=d?.requests??[];const current=requests.find(r=>r.id===d?.playback?.current_request_id)??null;const pending=requests.filter(r=>r.status==="PENDING");const queue=requests.filter(r=>r.status==="QUEUED").sort((a,b)=>Number(a.position??0)-Number(b.position??0));const obs=typeof location!=="undefined"&&settings?`${location.origin}/overlay/media-request?token=${settings.overlay_token}`:"";const mod=typeof location!=="undefined"&&settings?`${location.origin}/mod-queue?token=${settings.mod_token}`:"";
 const hasScopes=useMemo(()=>["channel:rewards:read","channel:rewards:write","events:subscribe"].every(s=>d?.kickScopes.includes(s)),[d?.kickScopes]);
 useChatMediaRequests(Boolean(settings));
 const player=useRef<HTMLIFrameElement>(null);
 const[engineOn,setEngineOn]=useState(false);
 usePlayerAutoAdvance(player,current?.id??null,id=>act.mutate({action:"ENDED",requestId:id}));
 const serverVolume=d?.playback?.volume??form.volume;
 const[vol,setVol]=useState(serverVolume);
 useEffect(()=>{setVol(serverVolume)},[serverVolume]);
 usePlayerCommands(player,current?.id??null,d?.playback?.playback_status,vol);
 const startEngine=useCallback(()=>{setEngineOn(true);player.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func:"playVideo",args:[]}),"https://www.youtube.com")},[]);
 const handleSelectLayout=useCallback((v:PlayerLayout)=>setForm(f=>({...f,playerLayout:v})),[]);
 const previewTrack=useMemo(()=>({title:current?.title??"Spiritbox - Halycon",requester:current?.requester_username??"chat",thumbnailUrl:current?(current.thumbnail_url??`https://i.ytimg.com/vi/${current.youtube_video_id}/mqdefault.jpg`):null,progress:.45,paused:d?.playback?.playback_status==="PAUSED"}),[current?.title,current?.requester_username,current?.thumbnail_url,current?.youtube_video_id,current,d?.playback?.playback_status]);
 return <AppShell user={user} title="Media Requests" subtitle="Kick channel points, a moderated YouTube queue, and an OBS-ready player."><div className="space-y-5">
 {!hasScopes&&<div className="rounded-xl border border-[#53fc18]/25 bg-[#53fc18]/10 p-4 text-sm text-[#b9ff9d]">Reconnect Kick in Settings once to grant reward read/write permissions.</div>}
 <section className={`${glass} overflow-hidden`}><div className="grid lg:grid-cols-[1.35fr_.65fr]"> <div className="aspect-video bg-black">{current?<iframe ref={player} className="size-full" title={current.title} allow="autoplay; encrypted-media" src={`https://www.youtube.com/embed/${current.youtube_video_id}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`}/>:<div className="grid size-full place-items-center text-sm text-white/35">Nothing playing</div>}</div><div className="flex flex-col p-5"><span className="text-xs font-bold uppercase tracking-[.22em] text-[#53fc18]">Now playing</span><h2 className="mt-3 line-clamp-2 text-xl font-bold">{current?.title??"Queue is ready"}</h2><p className="mt-2 text-sm text-muted-foreground">{current?`Requested by ${current.requester_username}`:"Approved videos will appear here."}</p><div className="mt-auto space-y-4 pt-6"><div className="flex gap-2"><Button onClick={()=>act.mutate({action:d?.playback?.playback_status==="PAUSED"?"RESUME":"PAUSE"})} disabled={!current}>{d?.playback?.playback_status==="PAUSED"?<Play/>:<Pause/>}{d?.playback?.playback_status==="PAUSED"?"Resume":"Pause"}</Button><Button variant="outline" onClick={()=>current&&act.mutate({action:"SKIP",requestId:current.id})} disabled={!current}><SkipForward/>Skip</Button></div>{!engineOn&&<Button variant="outline" className="w-full" onClick={startEngine}><Play/>Start audio/video engine</Button>}<div className="flex items-center gap-3"><Volume2 className="size-4"/><Slider value={[vol]} max={100} onValueChange={v=>setVol(v[0]??vol)} onValueCommit={v=>act.mutate({action:"VOLUME",volume:v[0]??vol})}/><span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{vol}</span></div></div></div></div></section>
 <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]"><section className={`${glass} p-5`}><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Up Next</h2><p className="text-xs text-muted-foreground">{queue.length} approved · {pending.length} awaiting review</p></div></div><div className="space-y-2">{[...pending,...queue].map((r,i)=><QueueRow key={r.id} r={r} index={i} act={v=>act.mutate(v)}/>)}{!pending.length&&!queue.length&&<div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">No media requests yet.</div>}</div></section>
 <aside className={`${glass} p-5`}>
   <div className="mb-4 flex items-center gap-2"><Settings2 className="size-4 text-primary"/><h2 className="font-bold">Queue setup</h2></div>
   <div className="mb-4 flex gap-1 rounded-xl border border-white/8 bg-black/20 p-1">
     <button onClick={()=>setSetupTab("setup")} className={`relative flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${setupTab==="setup"?"text-white":"text-white/50 hover:text-white/80"}`}>
       {setupTab==="setup"&&<span className="absolute inset-0 rounded-lg border border-[#53fc18]/40 bg-[#53fc18]/10 shadow-[0_0_12px_rgba(83,252,24,.15)]"/>}
       <span className="relative">Setup</span>
     </button>
     <button onClick={()=>setSetupTab("links")} className={`relative flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${setupTab==="links"?"text-white":"text-white/50 hover:text-white/80"}`}>
       {setupTab==="links"&&<span className="absolute inset-0 rounded-lg border border-[#53fc18]/40 bg-[#53fc18]/10 shadow-[0_0_12px_rgba(83,252,24,.15)]"/>}
       <span className="relative">Links</span>
     </button>
     <button onClick={()=>setSetupTab("safety")} className={`relative flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${setupTab==="safety"?"text-white":"text-white/50 hover:text-white/80"}`}>
       {setupTab==="safety"&&<span className="absolute inset-0 rounded-lg border border-[#53fc18]/40 bg-[#53fc18]/10 shadow-[0_0_12px_rgba(83,252,24,.15)]"/>}
       <span className="relative">Safety</span>
     </button>
   </div>
   {setupTab==="setup"&&<div key="setup" className="space-y-4">
     <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${d?.youtubeMode==="api"?"border-emerald-400/35 bg-emerald-400/10 text-emerald-200":"border-amber-400/35 bg-amber-400/10 text-amber-200"}`}><span className={`size-1.5 rounded-full ${d?.youtubeMode==="api"?"bg-emerald-400":"bg-amber-400"}`}/>{d?.youtubeMode==="api"?"YouTube API Active":"YouTube Basic oEmbed Mode (Active)"}</span>
     <RewardPicker value={form.kickRewardId} onChange={v=>setForm({...form,kickRewardId:v})}/>
     <Field label="Request mode"><DarkSelect value={form.requestMode} onValueChange={v=>setForm({...form,requestMode:v as "AUTO"|"MANUAL"|"PAUSED"})} options={[{value:"AUTO",label:"Auto approve"},{value:"MANUAL",label:"Manual review"},{value:"PAUSED",label:"Pause requests"}]}/></Field>
     <p className="-mt-2 text-[11px] text-muted-foreground">{form.requestMode==="AUTO"?"Requests are approved automatically and play when idle.":form.requestMode==="MANUAL"?"Requests wait in Up Next until you approve them.":"New chat requests are blocked until you resume."}</p>
     <Field label="OBS mode"><DarkSelect value={form.displayMode} onValueChange={v=>setForm({...form,displayMode:v as "VIDEO"|"AUDIO_ONLY"})} options={[{value:"VIDEO",label:"Video Box"},{value:"AUDIO_ONLY",label:"Audio Only"}]}/></Field>
     {form.displayMode==="AUDIO_ONLY"
       ?<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3"><span className="grid size-9 place-items-center rounded-full bg-[#53fc18]/15 text-[#53fc18]"><Volume2 className="size-4"/></span><div className="min-w-0"><p className="truncate text-xs font-semibold">Audio only mode</p><p className="truncate text-[11px] text-muted-foreground">A lightweight audio bar plays in OBS — no video layouts needed.</p></div></div>
       :<>
         <Field label="Player layout"><DarkSelect value={form.playerLayout} onValueChange={v=>setForm(f=>({...f,playerLayout:v as PlayerLayout}))} options={PLAYER_LAYOUT_OPTIONS}/></Field>
         <LayoutPreviews layout={form.playerLayout} onSelect={handleSelectLayout} track={previewTrack}/>
       </>}

     <Button className="w-full" onClick={()=>save.mutate()} disabled={save.isPending}><Save/>Save setup</Button>
   </div>}
   {setupTab==="links"&&<div key="links" className="space-y-4">
     {obs&&<Button className="w-full" variant="outline" onClick={()=>void navigator.clipboard.writeText(obs)}><Clipboard/>{form.displayMode==="AUDIO_ONLY"?"Copy OBS URL (audio only)":"Copy OBS URL"}</Button>}
     {mod&&<Button className="w-full" variant="outline" onClick={()=>void navigator.clipboard.writeText(mod)}><Clipboard/>Copy mod controls link</Button>}
     <ManualTestBox/>
     <a className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground" href="/settings">Manage Kick connection <ExternalLink className="size-3"/></a>
   </div>}
   {setupTab==="safety"&&<div key="safety" className="space-y-4">
     <Field label="Blocked keywords"><input value={form.keywordBlacklist} onChange={e=>setForm({...form,keywordBlacklist:e.target.value})} placeholder="spam, offensive" className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3"/></Field>
     <Field label="Blocked users"><input value={form.userBlacklist} onChange={e=>setForm({...form,userBlacklist:e.target.value})} className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3"/></Field>
     <Button className="w-full" onClick={()=>save.mutate()} disabled={save.isPending}><Save/>Apply moderation rules</Button>
   </div>}
 </aside></div></div></AppShell>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block space-y-1.5 text-xs text-muted-foreground"><span>{label}</span>{children}</label>}
const rewardError=(code:string)=>code==="kick_not_connected"?"Connect your Kick account in Settings to load rewards.":code==="kick_token_expired"?"Kick session expired — reconnect Kick in Settings.":"Couldn't load rewards from Kick. Try again.";
function RewardPicker({value,onChange}:{value:string;onChange:(v:string)=>void}){
  const rewards=useQuery({queryKey:["kick-rewards"],queryFn:()=>listKickRewardsFn(),staleTime:60_000});
  const create=useMutation({mutationFn:()=>createKickMediaRewardFn({data:{title:"Media Request",cost:5000}}),onSuccess:r=>{if("reward" in r){onChange(r.reward.id);void rewards.refetch()}}});
  const data=rewards.data;
  const list="rewards" in (data??{})?(data as {rewards:{id:string;title:string;cost:number}[]}).rewards:[];
  const errCode=data&&"error" in data?data.error:rewards.isError?"kick_api_error":create.data&&"error" in create.data?create.data.error:null;
  const options=list.map(r=>({value:r.id,label:`${r.title} — ${r.cost.toLocaleString()} pts`}));
  if(value&&!options.some(o=>o.value===value))options.unshift({value,label:`Reward ${value}`});
  return <div className="space-y-2">
    <Field label="Kick channel point reward">
      {rewards.isFetching&&!list.length
        ?<div className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Loading rewards…</div>
        :<DarkSelect value={value} onValueChange={onChange} options={options} placeholder={options.length?"Select a reward":"No rewards found"} disabled={!options.length}/>}
    </Field>
    {errCode&&<p className="text-xs text-amber-300">{rewardError(errCode)} <a className="underline" href="/settings">Open Settings</a></p>}
    <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={()=>void rewards.refetch()} disabled={rewards.isFetching}><RefreshCw className={rewards.isFetching?"animate-spin":""}/>Fetch rewards</Button>
      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={()=>create.mutate()} disabled={create.isPending}>{create.isPending?<Loader2 className="animate-spin"/>:<Plus/>}Create reward</Button>
    </div>
  </div>;
}
function QueueRow({r,index,act}:{r:Req;index:number;act:(v:Parameters<typeof mediaRequestAction>[0]["data"])=>void}){return <div className="group flex items-center gap-3 rounded-xl border border-white/8 bg-black/15 p-3"><span className="w-6 text-center font-mono text-xs text-muted-foreground">{index+1}</span><img src={r.thumbnail_url??`https://i.ytimg.com/vi/${r.youtube_video_id}/mqdefault.jpg`} className="h-14 w-24 rounded-lg object-cover" alt=""/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{r.title}</p><div className="mt-1 flex gap-2 text-xs text-muted-foreground"><span className="text-[#53fc18]">Kick</span><span>{r.requester_username}</span><span>·</span><span>{fmt(r.duration_seconds)}</span>{r.status==="PENDING"&&<span className="text-amber-300">Pending</span>}</div></div><div className="flex gap-1">{r.status==="PENDING"&&<Button size="icon" onClick={()=>act({action:"APPROVE",requestId:r.id})}><Check/></Button>}<Button size="icon" variant="outline" onClick={()=>act({action:"PLAY",requestId:r.id})}><Play/></Button>{r.status==="PENDING"&&<Button size="icon" variant="outline" onClick={()=>act({action:"REJECT",requestId:r.id})}><X/></Button>}<Button size="icon" variant="ghost" onClick={()=>act({action:"DELETE",requestId:r.id})}><Trash2/></Button></div></div>}

function ManualTestBox(){
  const qc=useQueryClient();const[url,setUrl]=useState("");
  const add=useMutation({mutationFn:()=>addManualMediaRequest({data:{url}}),onSuccess:r=>{if(r.ok){setUrl("");void qc.invalidateQueries({queryKey:["media-requests"]})}}});
  const result=add.data;
  return <div className="space-y-2 rounded-xl border border-white/10 bg-black/15 p-3">
    <p className="text-xs font-semibold text-muted-foreground">Queue test video</p>
    <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm"/>
    <Button type="button" size="sm" className="w-full" onClick={()=>add.mutate()} disabled={!url.trim()||add.isPending}>{add.isPending?<Loader2 className="animate-spin"/>:<Plus/>}Queue test video</Button>
    {result&&<p className={`text-xs ${result.ok?"text-[#53fc18]":"text-amber-300"}`}>{result.ok?`Queued: ${result.title}`:`Failed: ${result.error}`}</p>}
  </div>;
}


const LayoutPreviews=memo(function LayoutPreviews({layout,onSelect,track}:{layout:PlayerLayout;onSelect:(v:PlayerLayout)=>void;track:React.ComponentProps<typeof MediaPlayerCard>["track"]}){
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">Live preview — colors follow the current track artwork.</p>
    {PLAYER_LAYOUT_OPTIONS.map(o=><button key={o.value} type="button" onClick={()=>onSelect(o.value as PlayerLayout)} className={`block w-full rounded-2xl border p-3 text-left transition ${layout===o.value?"border-[#53fc18]/60 bg-[#53fc18]/5":"border-white/10 bg-black/25 hover:border-white/25"}`}>
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{o.label}</span>
      <span className="block overflow-hidden rounded-xl bg-[url('https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg')] bg-cover bg-center p-3"><span className="block backdrop-blur-md"><MediaPlayerCard layout={o.value as PlayerLayout} track={track}/></span></span>
    </button>)}
  </div>;
});
