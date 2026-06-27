
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
  try{
    return new Date(value).toLocaleDateString();
  }catch(e){
    return "-";
  }
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
    users:["Users","Search and review Qevanta accounts."],
    referrals:["Referrals","Referral code and referred-user overview."],
    settings:["Settings","Plan limits and admin controls."]
  };

  $("pageTitle").textContent = titles[name]?.[0] || "Admin";
  $("pageSub").textContent = titles[name]?.[1] || "";
}

async function loadAdminData(){
  await Promise.all([
    loadOverview(),
    loadUsers()
  ]);
}

async function loadOverview(){
  const { data, error } = await supabase.rpc("qevanta_admin_overview");

  if(error){
    console.error(error);
    return;
  }

  const overview = data || {};

  $("totalUsers").textContent = overview.total_users || 0;
  $("freeUsers").textContent = overview.free_users || 0;
  $("starterUsers").textContent = overview.starter_users || 0;
  $("proUsers").textContent = overview.pro_users || 0;
  $("agencyUsers").textContent = overview.agency_users || 0;
  $("adminCount").textContent = overview.admins || 0;
}

async function loadUsers(){
  const { data, error } = await supabase.rpc("qevanta_admin_users");

  if(error){
    console.error(error);
    $("usersTable").innerHTML = `<tr><td colspan="7">Could not load users.</td></tr>`;
    return;
  }

  ADMIN_USERS = data || [];
  renderUsers();
  renderReferrals();
}

function renderUsers(){
  const q = $("userSearch")?.value?.toLowerCase() || "";

  const filtered = ADMIN_USERS.filter(u=>{
    const blob = [
      u.email,
      u.first_name,
      u.company_name,
      u.plan,
      u.referral_code,
      u.referred_by
    ].join(" ").toLowerCase();

    return !q || blob.includes(q);
  });

  if(!filtered.length){
    $("usersTable").innerHTML = `<tr><td colspan="7">No users found.</td></tr>`;
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
      </tr>
    `;
  }).join("");
}

function renderReferrals(){
  const usersWithReferral = ADMIN_USERS.filter(u=>u.referral_code);

  if(!usersWithReferral.length){
    $("referralList").innerHTML = `<div class="list-item">No referral codes found.</div>`;
    return;
  }

  $("referralList").innerHTML = usersWithReferral.map(u=>{
    const count = ADMIN_USERS.filter(x=>String(x.referred_by || "").toUpperCase() === String(u.referral_code || "").toUpperCase()).length;

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
