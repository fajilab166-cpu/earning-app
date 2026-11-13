const tg=window.Telegram?.WebApp; tg?.ready(); tg?.expand();
const initData=tg?.initData || "", $=id=>document.getElementById(id);
let config={}, me=null; const headers={"content-type":"application/json","x-telegram-init-data":initData};
async function api(path,options={}) {
 const r=await fetch(path,{...options,headers:{...headers,...(options.headers||{})}});
 const data=await r.json().catch(()=>({})); if(!r.ok) throw new Error(data.error || "Request failed"); return data;
}
const money=v=>"৳"+Number(v||0).toFixed(2), status=t=>$("status").textContent=t;
async function load(){
 try {
  if(!initData) throw new Error("অ্যাপটি Telegram-এর ভেতর থেকে চালু করুন।");
  [config,me]=await Promise.all([fetch("/api/config").then(r=>r.json()),api("/api/me")]);
  $("username").textContent=me.user.first_name || "Earning App";
  $("balance").textContent=money(me.user.balance_bdt); $("adsToday").textContent=me.adsToday; $("referrals").textContent=me.referrals;
  $("monetagBtn").disabled=!config.monetagZoneId; $("adsgramBtn").disabled=true;
 } catch(e){status(e.message);}
}
$("monetagBtn").addEventListener("click",async()=>{
 $("monetagBtn").disabled=true; status("বিজ্ঞাপন প্রস্তুত হচ্ছে...");
 try {
  const session=await api("/api/ad-session",{method:"POST",body:JSON.stringify({provider:"monetag"})});
  const fn=window["show_"+session.zoneId]; if(typeof fn!=="function") throw new Error("Monetag SDK লোড হয়নি। Zone ID ও SDK script যাচাই করুন।");
  await fn({ymid:session.ymid,requestVar:"rewarded"});
  status("বিজ্ঞাপন শেষ হয়েছে। Monetag সার্ভার যাচাই করলে রিওয়ার্ড যোগ হবে।"); setTimeout(load,2500);
 } catch(e){status(e.message);}
 finally{setTimeout(()=>$("monetagBtn").disabled=false,Math.max(1000,(config.cooldownSeconds||60)*1000));}
});
$("adsgramBtn").addEventListener("click",()=>status("AdsGram-এর সার্ভার-যাচাইযোগ্য reward callback নিশ্চিত না হওয়া পর্যন্ত রিওয়ার্ড বন্ধ রাখা হয়েছে।"));
document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>{
 const tab=btn.dataset.tab,box=$("extra"); box.classList.remove("hidden");
 if(tab==="home"){box.classList.add("hidden");return;}
 if(tab==="referral") box.innerHTML="<h2>রেফারেল</h2><p>রেফারেল লিংক ও কমিশন পরবর্তী ধাপে যুক্ত হবে।</p>";
 if(tab==="wallet") box.innerHTML="<h2>ওয়ালেট</h2><p>উত্তোলন ব্যবস্থা অ্যাডমিন অনুমোদনের পর চালু হবে।</p>";
}));
load();