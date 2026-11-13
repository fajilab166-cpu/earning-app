import { json } from "./_lib.js";
export default function handler(req,res) {
  if(req.method!=="GET") return json(res,405,{error:"Method not allowed"});
  return json(res,200,{
    appName:"Earning App",
    monetagSdkUrl:process.env.MONETAG_SDK_URL || "",
    monetagZoneId:process.env.MONETAG_ZONE_ID || "",
    adsgramBlockId:process.env.ADSGRAM_BLOCK_ID || "",
    dailyAdLimit:Number(process.env.DAILY_AD_LIMIT || 20),
    cooldownSeconds:Number(process.env.AD_COOLDOWN_SECONDS || 60),
    minWithdrawalBdt:Number(process.env.MIN_WITHDRAWAL_BDT || 100),
    monetagRewardBdt:Number(process.env.MONETAG_REWARD_BDT || 0.1),
    adsgramRewardsEnabled:false
  });
}