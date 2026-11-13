import { json,supabase } from "./_lib.js";
export default async function handler(req,res) {
  if(req.method!=="GET") return json(res,405,{error:"Method not allowed"});
  const q=req.query || {};
  if(!process.env.MONETAG_POSTBACK_SECRET || q.secret!==process.env.MONETAG_POSTBACK_SECRET) return res.status(403).send("Forbidden");
  const ymid=String(q.ymid || "");
  if(!ymid || !/^[a-zA-Z0-9._-]{1,180}$/.test(ymid)) return res.status(400).send("Bad ymid");
  if(q.reward_event_type!=="valued") return res.status(200).send("Ignored");
  const reward=Number(process.env.MONETAG_REWARD_BDT || 0.1);
  if(!Number.isFinite(reward) || reward<=0 || reward>1000) return res.status(500).send("Invalid reward config");
  const {error}=await supabase.rpc("credit_monetag_reward",{p_ymid:ymid,p_reward_bdt:reward,p_event_payload:q});
  if(error){console.error("Monetag reward RPC failed",error.message);return res.status(500).send("Retry");}
  return res.status(200).send("OK");
}