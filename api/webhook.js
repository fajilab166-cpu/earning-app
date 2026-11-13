import crypto from "node:crypto";
import { json } from "./_lib.js";
async function telegram(method,body) {
  const token=process.env.BOT_TOKEN; if(!token) throw new Error("BOT_TOKEN missing");
  const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const data=await r.json(); if(!data.ok) throw new Error(data.description || "Telegram API error"); return data.result;
}
export default async function handler(req,res) {
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});
  const supplied=req.headers["x-telegram-bot-api-secret-token"], expected=process.env.TELEGRAM_WEBHOOK_SECRET;
  if(!expected || !supplied || supplied.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(expected))) return res.status(403).send("Forbidden");
  const msg=req.body?.message; if(!msg?.text || !msg.from || !msg.chat) return res.status(200).send("OK");
  const text=msg.text.trim();
  if(text.startsWith("/start")) {
    await telegram("sendMessage",{chat_id:msg.chat.id,text:`স্বাগতম ${msg.from.first_name || "বন্ধু"}! 🎉\n\nEarning App-এ বিজ্ঞাপন দেখে ও বৈধ টাস্ক সম্পন্ন করে রিওয়ার্ড সংগ্রহ করুন।`,reply_markup:{inline_keyboard:[[{text:"🚀 অ্যাপ চালু করুন",web_app:{url:process.env.WEBAPP_URL}}]]}});
  } else if(text==="/help") {
    await telegram("sendMessage",{chat_id:msg.chat.id,text:"অ্যাপ চালু করতে /start লিখুন।"});
  }
  return res.status(200).send("OK");
}