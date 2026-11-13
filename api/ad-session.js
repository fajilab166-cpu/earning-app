import crypto from "node:crypto";
import { json,requireTelegramUser,supabase } from "./_lib.js";
export default async function handler(req,res) {
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});
  const auth=await requireTelegramUser(req,res); if(!auth) return;
  const provider=req.body?.provider;
  if(provider!=="monetag" && provider!=="adsgram") return json(res,400,{error:"Unknown provider"});
  if(provider==="adsgram") return json(res,409,{error:"AdsGram rewards are disabled until server-verifiable reward callbacks are configured."});
  if(!process.env.MONETAG_ZONE_ID) return json(res,503,{error:"Monetag zone is not configured"});
  const now=new Date(), dayStart=new Date(now); dayStart.setHours(0,0,0,0);
  const [{count},{data:last}]=await Promise.all([
    supabase.from("ad_sessions").select("*",{count:"exact",head:true}).eq("user_id",auth.user.id).gte("created_at",dayStart.toISOString()),
    supabase.from("ad_sessions").select("created_at").eq("user_id",auth.user.id).order("created_at",{ascending:false}).limit(1).maybeSingle()
  ]);
  const limit=Number(process.env.DAILY_AD_LIMIT || 20), cooldown=Number(process.env.AD_COOLDOWN_SECONDS || 60);
  if((count || 0)>=limit) return json(res,429,{error:"Daily ad limit reached"});
  if(last && now.getTime()-new Date(last.created_at).getTime()<cooldown*1000) return json(res,429,{error:"Please wait before watching another ad"});
  const id=crypto.randomUUID(), ymid=`u${auth.user.telegram_id}_${id.replaceAll("-","")}`;
  const {error}=await supabase.from("ad_sessions").insert({id,user_id:auth.user.id,provider:"monetag",ymid,status:"pending"});
  if(error) return json(res,500,{error:"Could not create ad session"});
  return json(res,200,{sessionId:id,ymid,zoneId:process.env.MONETAG_ZONE_ID});
}