const SUPABASE_URL = "https://mfgmkvmawhfdsigawrpn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJtZmdta3ZtYXdoZmRzaWdhd3JwbiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgxOTI5OTY2LCJleHAiOjIwOTc1MDU5NjZ9.6znoxf1v7SDdvBvjMwgdDTjQt7dpsI2qbmvVI1BPN5c";

let appliedReferral = null;

async function applyReferral(){
  const input = document.getElementById("referralCode");
  const status = document.getElementById("refStatus");
  const code = input?.value?.trim();

  if(!status) return;

  if(!code){
    status.textContent = "Please enter a referral code.";
    return;
  }

  status.textContent = "Checking referral code...";

  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/qevanta_validate_affiliate_code`, {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "apikey":SUPABASE_ANON_KEY
      },
      body:JSON.stringify({ code })
    });

    const data = await res.json().catch(() => ({}));
    const row = Array.isArray(data) ? data[0] : data;

    if(row && row.valid){
      appliedReferral = row;
      localStorage.setItem("qevanta_referral_code", row.affiliate_code || code.toUpperCase());
      status.textContent = `Referral applied: ${row.discount_percent || 0}% discount unlocked.`;
    }else{
      status.textContent = "Invalid referral code.";
    }
  }catch(e){
    localStorage.setItem("qevanta_referral_code", code.toUpperCase());
    status.textContent = "Referral checker is not connected right now. Code saved locally.";
  }
}

function startPlan(plan){
  const code = localStorage.getItem("qevanta_referral_code") || "";
  alert(
    `Plan selected: ${String(plan).toUpperCase()}` +
    (code ? `\nReferral code: ${code}` : "") +
    "\n\nStripe checkout will be connected later."
  );
}

function openModal(id){
  document.getElementById(id)?.classList.add("open");
}

function closeModal(id){
  document.getElementById(id)?.classList.remove("open");
}

function copyCode(){
  const el = document.getElementById("myCode");
  if(!el) return;

  el.select();
  document.execCommand("copy");
  alert("Referral code copied.");
}

document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener("click", e=>{
    const id = a.getAttribute("href");
    if(id && id.length > 1){
      const target = document.querySelector(id);
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:"smooth"});
      }
    }
  });
});
