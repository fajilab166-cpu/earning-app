const tg=window.Telegram?.WebApp; tg?.ready(); tg?.expand();
const initData=tg?.initData || "", $=id=>document.getElementById(id);
let config={}, me=null, adsgramController=null; const headers={"content-type":"application/json","x-telegram-init-data":initData};
async function api(path,options={}) {
 const r=await fetch(path,{...options,headers:{...headers,...(options.headers||{})}});
 const data=await r.json().catch(()=>({})); if(!r.ok) throw new Error(data.error || "Request failed"); return data;
}
const money=v=>"৳"+Number(v||0).toFixed(2), status=t=>$("status").textContent=t;
function loadMonetagSdk(){
 if(!config.monetagSdkUrl || !config.monetagZoneId) return;
 const script=document.createElement("script");
 script.src=config.monetagSdkUrl;
 script.dataset.zone=config.monetagZoneId;
 script.dataset.sdk="show_"+config.monetagZoneId;
 script.async=true;
 script.onerror=()=>status("Monetag SDK লোড করা যায়নি। SDK URL ও Zone ID যাচাই করুন।");
 document.head.appendChild(script);
}
async function load(){
 try {
  if(!initData) throw new Error("অ্যাপটি Telegram-এর ভেতর থেকে চালু করুন।");
  [config,me]=await Promise.all([fetch("/api/config").then(r=>r.json()),api("/api/me")]);
  $("username").textContent=me.user.first_name || "Earning App";
  $("balance").textContent=money(me.user.balance_bdt); $("adsToday").textContent=me.adsToday; $("referrals").textContent=me.referrals;
  $("monetagBtn").disabled=!config.monetagZoneId || !config.monetagSdkUrl;
  if(config.adsgramBlockId && window.Adsgram?.init) adsgramController=window.Adsgram.init({blockId:config.adsgramBlockId});
  $("adsgramBtn").disabled=!adsgramController;
  loadMonetagSdk();
 } catch(e){status(e.message);}
}
$("monetagBtn").addEventListener("click",async()=>{
 $("monetagBtn").disabled=true; status("বিজ্ঞাপন প্রস্তুত হচ্ছে...");
 try {
  const session=await api("/api/ad-session",{method:"POST",body:JSON.stringify({provider:"monetag"})});
  const fn=window["show_"+session.zoneId]; if(typeof fn!=="function") throw new Error("Monetag SDK প্রস্তুত নয়। SDK URL/Zone ID পরীক্ষা করুন।");
  const result=await fn({ymid:session.ymid,requestVar:"rewarded"});
  if(result?.reward_event_type==="valued") status("বিজ্ঞাপন যাচাই হয়েছে। ওয়ালেট আপডেট হচ্ছে।");
  else status("বিজ্ঞাপন প্রদর্শিত হয়েছে, তবে Monetag এটিকে paid বলেনি।");
  setTimeout(load,2500);
 } catch(e){status(e.message);}
 finally{setTimeout(()=>$("monetagBtn").disabled=false,Math.max(1000,(config.cooldownSeconds||60)*1000));}
});
$("adsgramBtn").addEventListener("click",async()=>{
 if(!adsgramController) return;
 $("adsgramBtn").disabled=true;
 try {
  const result=await adsgramController.show();
  if(result?.done) status("AdsGram বিজ্ঞাপন সম্পন্ন। তবে সার্ভার যাচাই ব্যবস্থা যুক্ত না হওয়া পর্যন্ত নগদ রিওয়ার্ড দেওয়া হচ্ছে না।");
  else status("AdsGram বিজ্ঞাপন সম্পন্ন হয়নি।");
 } catch(e){status("AdsGram বিজ্ঞাপন দেখানো যায়নি।");}
 finally{$("adsgramBtn").disabled=false;}
});
document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>{
 const tab=btn.dataset.tab,box=$("extra"); box.classList.remove("hidden");
 if(tab==="home"){box.classList.add("hidden");return;}
 if(tab==="referral") box.innerHTML="<h2>রেফারেল</h2><p>রেফারেল লিংক ও কমিশন পরবর্তী ধাপে যুক্ত হবে।</p>";
 if(tab==="wallet") box.innerHTML="<h2>ওয়ালেট</h2><p>উত্তোলন ব্যবস্থা অ্যাডমিন অনুমোদনের পর চালু হবে।</p>";
}));
load();