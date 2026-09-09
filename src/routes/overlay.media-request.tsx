import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MediaPlayerCard } from "@/components/media/MediaPlayerLayouts";
import { isPlayerLayout } from "@/lib/playerPalette";

type Payload={settings?:{display_mode:string;player_layout?:string;volume:number};playback:null|{playback_status:string;revision:number;volume:number};current:null|{id?:string;youtube_video_id:string;title:string;requester_username:string;requester_avatar_url:string|null;thumbnail_url?:string|null}};
export const Route=createFileRoute("/overlay/media-request")({validateSearch:(s:Record<string,unknown>)=>({token:typeof s["token"]==="string"?s["token"]:""}),head:()=>({meta:[{title:"Media Request — OBS Browser Source"},{name:"robots",content:"noindex"}]}),component:MediaOverlay});
function MediaOverlay(){const{token}=Route.useSearch();const[data,setData]=useState<Payload|null>(null);const frame=useRef<HTMLIFrameElement>(null);const currentId=data?.current?.id??null;const advancing=useRef(false);
 useEffect(()=>{document.body.classList.add("overlay-transparent");document.documentElement.style.background="transparent";return()=>document.body.classList.remove("overlay-transparent")},[]);
 useEffect(()=>{if(!token)return;let source:EventSource|null=null,stopped=false;const load=async()=>{const r=await fetch(`/api/public/media-request/${encodeURIComponent(token)}/live`,{cache:"no-store"});if(r.ok)setData(await r.json())};void load();source=new EventSource(`/api/public/media-request/${encodeURIComponent(token)}/stream`);source.addEventListener("playback",e=>setData(old=>({...old,...JSON.parse((e as MessageEvent).data)})));const poll=setInterval(()=>void load(),5000);return()=>{stopped=true;source?.close();clearInterval(poll);void stopped}},[token]);
 useEffect(()=>{const cmd=data?.playback?.playback_status==="PAUSED"?"pauseVideo":"playVideo";frame.current?.contentWindow?.postMessage(JSON.stringify({event:"command",func:cmd,args:[]}),"https://www.youtube.com")},[data?.playback?.playback_status,data?.playback?.revision]);
 // Subscribe to the embedded player's state so a finished video immediately
 // promotes the next approved request without any manual interaction.
 useEffect(()=>{
  advancing.current=false;
  if(!currentId)return;
  const handshake=setInterval(()=>frame.current?.contentWindow?.postMessage(JSON.stringify({event:"listening",id:currentId}),"https://www.youtube.com"),1000);
  const onMessage=(event:MessageEvent)=>{
   if(!String(event.origin).includes("youtube.com"))return;
   let payload:{event?:string;info?:unknown};
   try{payload=typeof event.data==="string"?JSON.parse(event.data):event.data as {event?:string;info?:unknown}}catch{return}
   const info=payload?.info;
   const state=typeof info==="number"?info:(info&&typeof info==="object"?(info as {playerState?:number}).playerState:undefined);
   if(state!==0||advancing.current)return;
   advancing.current=true;
   void fetch(`/api/public/media-request/${encodeURIComponent(token)}/advance`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:currentId})}).catch(()=>undefined);
  };
  window.addEventListener("message",onMessage);
  return()=>{clearInterval(handshake);window.removeEventListener("message",onMessage)};
 },[currentId,token]);
 const current=data?.current;if(!current)return <main className="min-h-screen bg-transparent"/>;const audio=data?.settings?.display_mode==="AUDIO_ONLY";
 return <main className="flex min-h-screen items-center justify-center bg-transparent p-6"><div className={audio?"w-[760px]":"w-[960px]"}>{!audio&&<div className="aspect-video overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl"><iframe ref={frame} title={current.title} className="size-full" allow="autoplay; encrypted-media" src={`https://www.youtube.com/embed/${current.youtube_video_id}?autoplay=1&enablejsapi=1&controls=0&rel=0&playsinline=1`}/></div>}{audio&&<iframe ref={frame} title={current.title} className="absolute size-px opacity-0" allow="autoplay" src={`https://www.youtube.com/embed/${current.youtube_video_id}?autoplay=1&enablejsapi=1`}/>}<div className="mx-auto -mt-5 w-[92%]"><MediaPlayerCard layout={audio?"COMPACT_SLIM":(isPlayerLayout(data?.settings?.player_layout)?data.settings.player_layout:"VERTICAL_CARD")} track={{title:current.title,requester:current.requester_username,thumbnailUrl:current.thumbnail_url??`https://i.ytimg.com/vi/${current.youtube_video_id}/mqdefault.jpg`,paused:data?.playback?.playback_status==="PAUSED"}}/></div></div></main>}
