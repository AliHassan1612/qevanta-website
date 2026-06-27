async function checkAdminSession(){
  const { data:{ session } } = await qevantaDb.auth.getSession();

  if(!session){
    showLogin();
    return;
  }

  const { data, error } = await qevantaDb.rpc("qevanta_is_admin");

  if(error || data !== true){
    await qevantaDb.auth.signOut();
    showLogin("Access denied. This account is not an admin.");
    return;
  }

  showApp();
  loadAdminData();
}

function showLogin(message){
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("adminApp").classList.add("hidden");

  if(message){
    document.getElementById("loginMsg").textContent = message;
  }
}

function showApp(){
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("adminApp").classList.remove("hidden");
}

async function adminLogin(){
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();
  const msg = document.getElementById("loginMsg");

  if(!email || !password){
    msg.textContent = "Enter admin email and password.";
    return;
  }

  msg.textContent = "Logging in...";

  const { error } = await qevantaDb.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    msg.textContent = error.message || "Login failed.";
    return;
  }

  await checkAdminSession();
}

async function adminLogout(){
  await qevantaDb.auth.signOut();
  location.reload();
}

document.getElementById("adminLoginBtn").addEventListener("click", adminLogin);
document.getElementById("logoutBtn").addEventListener("click", adminLogout);

checkAdminSession();
