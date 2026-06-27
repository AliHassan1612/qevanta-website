let ADMIN_USERS = [];
let ADMIN_MESSAGES = [];

function $(id){ return document.getElementById(id); }

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
    contact:["Contact","Messages submitted from the contact page."],
    affiliates:["Affiliates","Affiliate applications submitted from the affiliate page."],
    analytics:["Analytics","Qevanta usage and growth overview."],
    settings:["Settings","Plan limits and admin controls."]
    logs:["Activity Logs","Track important admin actions inside Qevanta."],
  };

  $("pageTitle").textContent = titles[name]?.[0] || "Admin";
  $("pageSub").textContent = titles[name]?.[1] || "";
}

async function loadAdminData(){
  await loadOverview();
  await loadUsers();
  await loadMessages();
  await loadAnalytics();
  await loadLogs();
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

async function loadMessages(){
  const { data, error } = await qevantaDb.rpc("qevanta_admin_messages");

  if(error){
    console.error(error);
    return;
  }

  ADMIN_MESSAGES = data || [];
  renderContactMessages();
  renderAffiliateMessages();
}
async function loadAnalytics(){
  const { data, error } = await qevantaDb.rpc("qevanta_admin_analytics");

  if(error){
    console.error(error);
    return;
  }
  async function loadLogs(){
  const { data, error } = await qevantaDb.rpc("qevanta_admin_logs_list");

  if(error){
    console.error(error);
    return;
  }

  renderLogs(data || []);
}

function renderLogs(logs){
  if(!logs.length){
    $("activityLogs").innerHTML = `<div class="list-item">No activity logs yet.</div>`;
    return;
  }

  $("activityLogs").innerHTML = logs.map(log=>`
    <div class="list-item" style="display:block">
      <b>${esc(log.action || "-")}</b>
      <p>${esc(JSON.stringify(log.details || {}))}</p>
      <small>${esc(formatDate(log.created_at))}</small>
    </div>
  `).join("");
}

  const a = data || {};

  $("signupsToday").textContent = a.signups_today || 0;
  $("signups7Days").textContent = a.signups_7_days || 0;
  $("messagesTotal").textContent = a.messages_total || 0;
  $("contactMessagesCount").textContent = a.contact_messages || 0;
  $("affiliateAppsCount").textContent = a.affiliate_applications || 0;
  $("creditsUsedTotal").textContent = a.total_credits_used || 0;
}
function renderUsers(){
  const q = $("userSearch")?.value?.toLowerCase() || "";

  const filtered = ADMIN_USERS.filter(u=>{
    const blob = [u.email,u.first_name,u.company_name,u.plan,u.referral_code,u.referred_by].join(" ").toLowerCase();
    return !q || blob.includes(q);
  });

  if(!filtered.length){
    $("usersTable").innerHTML = `<tr><td colspan="8">No users found.</td></tr>`;
    return;
  }

  $("usersTable").innerHTML = filtered.map(u=>{
    return `
      <tr>
        <td>${esc(u.email)}</td>
        <td>${esc(u.first_name || "-")}</td>
        <td>${esc(u.company_name || "-")}</td>
        <td><span class="badge">${esc((u.plan || "FREE").toUpperCase())}</span></td>
        <td>${esc(Number(u.credits_used || 0))} / ${esc(u.credits_monthly ?? 0)}</td>
        <td><b>${esc(u.referral_code || "-")}</b><br><small>By: ${esc(u.referred_by || "-")}</small></td>
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
  if(!confirm(`Change ${u.email} to ${plan}?`)) return;
  await updateUser(userId, plan, planCredits(plan), Number(u.credits_used || 0));
}

async function addCredits(userId, amount){
  const u = getUser(userId);
  if(!u) return;
  if(!confirm(`Add ${amount} credits to ${u.email}?`)) return;
  await updateUser(userId, u.plan || "FREE", Number(u.credits_monthly || 0) + amount, Number(u.credits_used || 0));
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
        <div><b>${esc(u.referral_code)}</b><br><small>${esc(u.email)}</small></div>
        <span>${count} referrals</span>
      </div>
    `;
  }).join("");
}

function renderContactMessages(){
  const messages = ADMIN_MESSAGES.filter(m=>m.type === "contact");

  if(!messages.length){
    $("contactMessages").innerHTML = `<div class="list-item">No contact messages yet.</div>`;
    return;
  }

  $("contactMessages").innerHTML = messages.map(m=>`
    <div class="list-item" style="display:block">
      <b>${esc(m.name || "-")}</b> · ${esc(m.email || "-")}
      <p>${esc(m.message || "-")}</p>
      <small>Status: ${esc(m.status)} · ${esc(formatDate(m.created_at))}</small><br><br>
      <button class="mini" onclick="updateMessageStatus('${m.id}','read')">Mark Read</button>
      <button class="mini danger" onclick="updateMessageStatus('${m.id}','deleted')">Delete</button>
    </div>
  `).join("");
}

function renderAffiliateMessages(){
  const messages = ADMIN_MESSAGES.filter(m=>m.type === "affiliate");

  if(!messages.length){
    $("affiliateMessages").innerHTML = `<div class="list-item">No affiliate applications yet.</div>`;
    return;
  }

  $("affiliateMessages").innerHTML = messages.map(m=>`
    <div class="list-item" style="display:block">
      <b>${esc(m.name || "-")}</b> · ${esc(m.email || "-")}
      <p><b>Profile:</b> ${esc(m.profile || "-")}</p>
      <p><b>Audience:</b> ${esc(m.audience_size || "-")}</p>
      <p><b>Method:</b> ${esc(m.promotion_method || "-")}</p>
      <p>${esc(m.message || "-")}</p>
      <small>Status: ${esc(m.status)} · ${esc(formatDate(m.created_at))}</small><br><br>
      <button class="mini" onclick="updateMessageStatus('${m.id}','approved')">Approve</button>
      <button class="mini danger" onclick="updateMessageStatus('${m.id}','rejected')">Reject</button>
    </div>
  `).join("");
}

async function updateMessageStatus(id, status){
  const { error } = await qevantaDb.rpc("qevanta_admin_update_message_status", {
    p_message_id:id,
    p_status:status
  });

  if(error){
    alert(error.message || "Status update failed.");
    return;
  }

  await loadMessages();
}

document.querySelectorAll(".nav").forEach(btn=>{
  btn.addEventListener("click", ()=>showView(btn.dataset.view));
});

$("refreshBtn").addEventListener("click", loadAdminData);
$("userSearch").addEventListener("input", renderUsers);
