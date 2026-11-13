import { json,requireTelegramUser,supabase } from "./_lib.js";
export default async function handler(req,res) {
  if(req.method!=="GET") return json(res,405,{error:"Method not allowed"});
  const auth=await requireTelegramUser(req,res); if(!auth) return;
  const start=new Date(); start.setHours(0,0,0,0);
  const {data:rows}=await supabase.from("ad_sessions").select("id,provider,status,created_at")
    .eq("user_id",auth.user.id).gte("created_at",start.toISOString());
  const {count}=await supabase.from("users").select("id",{count:"exact",head:true}).eq("referred_by",auth.user.id);
  return json(res,200,{user:auth.user,adsToday:rows?.filter(x=>x.status==="credited").length || 0,referrals:count || 0});
}