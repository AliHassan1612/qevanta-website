let ADMIN_USERS = [];

function $(id){
  return document.getElementById(id);
}

function esc(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function formatDate(value){
  if(!value) return "-";
  try{return new Date(value).toLocaleDateString();}
  catch(e){return "-";}
}

function planCredits(plan){
  plan = String(plan || "FREE").toUpperCase();
  if(plan === "STARTER") return 3000;
  if(plan === "PRO") return 10000;
  if(plan === "AGENCY") return 999999;
  return 100;
}

function showView(name){
  document.querySelectorAll(".view").forEach(v=>{
    v.classList.toggle("hidden", v.id !== name);
  });

  document.querySelectorAll(".nav").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.view === name);
  });

  const titles = {
    dashboard:["Dashboard","Qevanta business overview and user management."],
    users:["Users","Search and manage Qevanta accounts."],
    referrals:["Referrals","Referral code and referred-user overview."],
    settings:["Settings","Plan limits and admin controls."]
  };

  $("pageTitle").textContent = titles[name]?.[0] || "Admin";
  $("pageSub").textContent = titles[name]?.[1] || "";
}

async function loadAdminData(){
  await Promise.all([loadOverview(), loadUsers()]);
}

async function loadOverview(){
  const { data, error } = await qevantaDb.rpc("qevanta_admin_overview");
  if(error){console.error(error);return;}

  const o = data || {};
  $("totalUsers").textContent = o.total_users || 0;
  $("freeUsers").textContent = o.free_users || 0;
  $("starterUsers").textContent = o.starter_users || 0;
  $("proUsers").textContent = o.pro_users || 0;
  $("agencyUsers").textContent = o.agency_users || 0;
  $("adminCount").textContent = o.admins || 0;
}

async function loadUsers(){
  const { data, error } = await qevantaDb.rpc("qevanta_admin_users");

  if(error){
    console.error(error);
    $("usersTable").innerHTML = `<tr><td colspan="8">Could not load users.</td></tr>`;
    return;
  }

  ADMIN_USERS = data || [];
  renderUsers();
  renderReferrals();
}

function renderUsers(){
  const q = $("userSearch")?.value?.toLowerCase() || "";

  const filtered = ADMIN_USERS.filter(u=>{
    const blob = [u.email,u.first_name,u.company_name,u.plan,u.referral_code,u.referred_by]
      .join(" ").toLowerCase();
    return !q || blob.includes(q);
  });

  if(!filtered.length){
    $("usersTable").innerHTML = `<tr><td colspan="8">No users found.</td></tr>`;
    return;
  }

  $("usersTable").innerHTML = filtered.map(u=>{
    const used = Number(u.credits_used || 0);
    const monthly = u.credits_monthly ?? 0;

    return `
      <tr>
        <td>${esc(u.email)}</td>
        <td>${esc(u.first_name || "-")}</td>
        <td>${esc(u.company_name || "-")}</td>
        <td><span class="badge">${esc((u.plan || "FREE").toUpperCase())}</span></td>
        <td>${esc(used)} / ${esc(monthly)}</td>
        <td>
          <b>${esc(u.referral_code || "-")}</b><br>
          <small>By: ${esc(u.referred_by || "-")}</small>
        </td>
        <td>${esc(formatDate(u.created_at))}</td>
        <td>
          <button class="mini" onclick="quickPlan('${u.id}','FREE')">Free</button>
          <button class="mini" onclick="quickPlan('${u.id}','STARTER')">Starter</button>
          <button class="mini" onclick="quickPlan('${u.id}','PRO')">Pro</button>
          <button class="mini" onclick="quickPlan('${u.id}','AGENCY')">Agency</button>
          <button class="mini" onclick="addCredits('${u.id}',500)">+500</button>
          <button class="mini danger" onclick="resetUsed('${u.id}')">Reset Used</button>
        </td>
      </tr>
    `;
  }).join("");
}

async function updateUser(userId, plan, monthly, used){
  const { error } = await qevantaDb.rpc("qevanta_admin_update_user", {
    p_user_id:userId,
    p_plan:plan,
    p_credits_monthly:monthly,
    p_credits_used:used
  });

  if(error){
    alert(error.message || "Update failed.");
    return;
  }

  await loadAdminData();
}

function getUser(userId){
  return ADMIN_USERS.find(u=>u.id === userId);
}

async function quickPlan(userId, plan){
  const u = getUser(userId);
  if(!u) return;

  const monthly = planCredits(plan);
  const used = Number(u.credits_used || 0);

  if(!confirm(`Change ${u.email} to ${plan}?`)) return;

  await updateUser(userId, plan, monthly, used);
}

async function addCredits(userId, amount){
  const u = getUser(userId);
  if(!u) return;

  const monthly = Number(u.credits_monthly || 0) + Number(amount || 0);

  if(!confirm(`Add ${amount} credits to ${u.email}?`)) return;

  await updateUser(userId, u.plan || "FREE", monthly, Number(u.credits_used || 0));
}

async function resetUsed(userId){
  const u = getUser(userId);
  if(!u) return;

  if(!confirm(`Reset used credits for ${u.email}?`)) return;

  await updateUser(userId, u.plan || "FREE", Number(u.credits_monthly || 100), 0);
}

function renderReferrals(){
  const usersWithReferral = ADMIN_USERS.filter(u=>u.referral_code);

  if(!usersWithReferral.length){
    $("referralList").innerHTML = `<div class="list-item">No referral codes found.</div>`;
    return;
  }

  $("referralList").innerHTML = usersWithReferral.map(u=>{
    const count = ADMIN_USERS.filter(x=>
      String(x.referred_by || "").toUpperCase() === String(u.referral_code || "").toUpperCase()
    ).length;

    return `
      <div class="list-item">
        <div>
          <b>${esc(u.referral_code)}</b><br>
          <small>${esc(u.email)}</small>
        </div>
        <span>${count} referrals</span>
      </div>
    `;
  }).join("");
}

document.querySelectorAll(".nav").forEach(btn=>{
  btn.addEventListener("click", ()=>showView(btn.dataset.view));
});

$("refreshBtn").addEventListener("click", loadAdminData);
$("userSearch").addEventListener("input", renderUsers);
