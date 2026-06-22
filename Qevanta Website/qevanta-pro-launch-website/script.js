const SUPABASE_URL = "https://mfgmkvmawhfdsigawrpn.supabase.co";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_KEY_HERE";
let appliedReferral = null;
async function applyReferral(){
  const code=document.getElementById('referralCode').value.trim();
  const status=document.getElementById('refStatus');
  if(!code){status.textContent='Please enter a referral code.';return;}
  status.textContent='Checking referral code...';
  try{
    const res=await fetch(`${SUPABASE_URL}/rest/v1/rpc/qevanta_validate_affiliate_code`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_ANON_KEY},body:JSON.stringify({code})});
    const data=await res.json();
    const row=Array.isArray(data)?data[0]:data;
    if(row&&row.valid){appliedReferral=row;localStorage.setItem('qevanta_referral_code',row.affiliate_code);status.textContent=`Referral applied: ${row.discount_percent}% discount unlocked.`}else{status.textContent='Invalid referral code.'}
  }catch(e){status.textContent='Referral checker is not connected yet. Code saved locally.';localStorage.setItem('qevanta_referral_code',code.toUpperCase());}
}
function startPlan(plan){const code=localStorage.getItem('qevanta_referral_code')||'';alert(`Plan selected: ${plan.toUpperCase()}${code?'\nReferral code: '+code:''}\n\nStripe checkout will be connected here.`)}
function openModal(id){document.getElementById(id).classList.add('open')}function closeModal(id){document.getElementById(id).classList.remove('open')}function copyCode(){const el=document.getElementById('myCode');el.select();document.execCommand('copy');alert('Referral code copied.')}document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(id.length>1){e.preventDefault();document.querySelector(id)?.scrollIntoView({behavior:'smooth'});}}));
