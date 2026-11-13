import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
  auth: { persistSession: false, autoRefreshToken: false }
});

export function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8").send(body);
}

export function verifyTelegramInitData(initData) {
  if (!initData || !process.env.BOT_TOKEN) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(process.env.BOT_TOKEN).digest();
  const calculated = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const a = Buffer.from(calculated, "hex"), b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a,b)) return null;
  try { const user = JSON.parse(params.get("user") || "null"); return user?.id ? user : null; }
  catch { return null; }
}

export async function requireTelegramUser(req,res) {
  const tgUser = verifyTelegramInitData(req.headers["x-telegram-init-data"] || req.body?.initData);
  if (!tgUser) { json(res,401,{error:"Invalid or expired Telegram session"}); return null; }
  const {data,error} = await supabase.from("users").upsert({
    telegram_id:String(tgUser.id), username:tgUser.username || null,
    first_name:tgUser.first_name || "User", last_name:tgUser.last_name || null,
    last_seen_at:new Date().toISOString()
  },{onConflict:"telegram_id"}).select("id,telegram_id,username,first_name,balance_bdt,is_blocked").single();
  if (error || !data || data.is_blocked) {
    json(res,data?.is_blocked ? 403 : 500,{error:data?.is_blocked ? "Account blocked" : "Database error"});
    return null;
  }
  return {tgUser,user:data};
}