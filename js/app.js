// ---------- helpers ----------
const $=s=>document.querySelector(s),KEY='gymdb';
const today=()=>new Date().toISOString().slice(0,10);
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const inr=n=>'₹'+Number(n).toLocaleString('en-IN');
const by=(a,id)=>a.find(x=>x.id==id);

function seed(){
  const d={seq:{},plans:[],trainers:[],workouts:[],members:[],ms:[],pay:[]};
  const n=k=>d.seq[k]=(d.seq[k]||0)+1;
  [['1 Month',30,1500],['3 Months',90,4000],['6 Months',180,7000],['1 Year',365,12000]].forEach(([name,days,price])=>d.plans.push({id:n('plans'),name,days,price}));
  [['Rohit Sharma','9876500001','rohit@gym.com','Strength Training',25000],['Neha Patil','9876500002','neha@gym.com','Yoga & Cardio',22000],['Aman Verma','9876500003','aman@gym.com','CrossFit',28000]].forEach(([name,phone,email,spec,salary])=>d.trainers.push({id:n('trainers'),name,phone,email,spec,salary}));
  [['Beginner Full Body','Easy 3-day routine','Squats 3x12\nPush-ups 3x10\nPlank 3x30s','4 weeks'],['Fat Loss Cardio','Cardio focused plan','Treadmill 20 min\nCycling 15 min\nJump rope 5x1 min','6 weeks'],['Muscle Gain','Heavy lifting split','Bench press 4x8\nDeadlift 4x6\nPull-ups 3x8','8 weeks']].forEach(([name,description,exercises,duration])=>d.workouts.push({id:n('workouts'),name,description,exercises,duration}));
  [['Aarav Mehta','9000000001','aarav@mail.com','Male',22,'Pune',1,1,2,20,0,4000],['Priya Singh','9000000002','priya@mail.com','Female',27,'Pimpri',2,2,1,45,0,1500],['Rahul Desai','9000000003','rahul@mail.com','Male',31,'Nigdi',3,3,4,100,1000,6000],['Sneha Kulkarni','9000000004','sneha@mail.com','Female',24,'Chinchwad',2,2,3,10,0,0],['Karan Joshi','9000000005','karan@mail.com','Male',29,'Akurdi',1,1,1,5,0,1500]].forEach(([name,phone,email,gender,age,address,trainerId,workoutId,pid,ago,disc,paid])=>{
    const mid=n('members'),pl=by(d.plans,pid),s=addDays(today(),-ago);
    d.members.push({id:mid,name,phone,email,gender,age,address,trainerId,workoutId});
    const m={id:n('ms'),memberId:mid,planId:pid,start:s,end:addDays(s,pl.days),fee:pl.price,disc};d.ms.push(m);
    if(paid)d.pay.push({id:n('pay'),msId:m.id,memberId:mid,amount:paid,date:s,method:'Cash'});
  });
  return d;
}
let db=JSON.parse(localStorage.getItem(KEY)||'null')||seed();
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const nid=k=>db.seq[k]=(db.seq[k]||0)+1;
if(!db.admins){db.admins=[{id:1,username:'admin',password:'admin123'}];db.seq.admins=1}
save();

// ---------- business rules ----------
const lastMs=id=>db.ms.filter(m=>m.memberId==id).sort((a,b)=>b.end.localeCompare(a.end))[0];
const paid=m=>db.pay.filter(p=>p.msId==m.id).reduce((s,p)=>s+p.amount,0);
const bal=m=>m.fee-m.disc-paid(m);                       // balance = fee - discount - paid
const pst=m=>bal(m)<=0?'Paid':paid(m)>0?'Partially Paid':'Pending';
const mst=m=>!m?'No Plan':m.end<today()?'Expired':'Active';
const badge=s=>`<span class="b ${s.replace(/ /g,'')}">${s}</span>`;
const tbl=(h,r)=>`<div class="tw"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${r||`<tr><td colspan="${h.length}" class="empty">No records found</td></tr>`}</tbody></table></div>`;
const printEl=m=>{document.body.dataset.print=m;window.print();delete document.body.dataset.print};
const show=h=>{const d=$('#dlg');d.innerHTML=h;if(!d.open)d.showModal()};
const closeB='<button type="button" class="btn g" onclick="$(\'#dlg\').close()">Close</button>';

function addMs(mid,d){
  const pl=by(db.plans,d.planId);if(!pl)return'Please create a plan first';
  const disc=+d.disc||0,pd=+d.paid||0;
  if(disc<0||disc>pl.price)return'Invalid discount';
  if(pd<0||pd>pl.price-disc)return'Paid amount cannot be more than payable amount';
  const last=lastMs(mid);let s=today();
  if(last&&last.end>=s)s=addDays(last.end,1);           // renewal starts after current plan ends
  const m={id:nid('ms'),memberId:mid,planId:pl.id,start:s,end:addDays(s,pl.days),fee:pl.price,disc};
  db.ms.push(m);
  if(pd>0)db.pay.push({id:nid('pay'),msId:m.id,memberId:mid,amount:pd,date:today(),method:d.method});
}

// ---------- generic form dialog ----------
function openForm(title,fields,vals,cb){
  show(`<h3>${title}</h3><form id="f">${fields.map(f=>`<label>${f.l}${
    f.t=='select'?`<select name="${f.n}">${f.o.map(([v,l=v])=>`<option value="${e(v)}" ${vals[f.n]==v?'selected':''}>${e(l)}</option>`).join('')}</select>`
    :f.t=='textarea'?`<textarea name="${f.n}">${e(vals[f.n])}</textarea>`
    :`<input name="${f.n}" type="${f.t||'text'}" value="${e(vals[f.n])}" ${f.r?'required':''} ${f.t=='number'?'step="any" min="0"':''}>`}</label>`).join('')}
    <p id="err" class="err"></p><div class="row"><button class="btn">Save</button>${closeB}</div></form>`);
  $('#f').onsubmit=ev=>{ev.preventDefault();const d=Object.fromEntries(new FormData(ev.target));const er=cb(d);if(er)return $('#err').textContent=er;save();$('#dlg').close();render()};
}
function ed(key,title,fields,id,chk){
  const o=id?by(db[key],id):{};
  openForm((id?'Edit ':'Add ')+title,fields,o,d=>{const er=chk&&chk(d,id);if(er)return er;if(id)Object.assign(o,d);else db[key].push({id:nid(key),...d})});
}
function del(k,id){
  if(k=='admins'){const a=by(db.admins,id);if(db.admins.length<=1||a.username==sessionStorage.in)return alert('You cannot delete the last admin or the account you are logged in with.')}
  if(k=='plans'&&db.ms.some(m=>m.planId==id))return alert('This plan is used by memberships, so it cannot be deleted.');
  if(!confirm('Are you sure you want to delete this record?'))return;
  if(k=='members'){db.pay=db.pay.filter(p=>p.memberId!=id);db.ms=db.ms.filter(m=>m.memberId!=id)}   // no orphan records
  if(k=='trainers')db.members.forEach(m=>{if(m.trainerId==id)m.trainerId=''});
  if(k=='workouts')db.members.forEach(m=>{if(m.workoutId==id)m.workoutId=''});
  db[k]=db[k].filter(r=>r.id!=id);save();render();
}
const actBtns=(k,id)=>`<td class="act"><button onclick="edit_${k}(${id})">Edit</button><button class="d" onclick="del('${k}',${id})">Delete</button></td>`;

// ---------- field definitions ----------
const sel=o=>({t:'select',o});
const planOpts=()=>db.plans.map(p=>[p.id,`${p.name} (${inr(p.price)})`]);
const payFields=()=>[{n:'planId',l:'Membership plan',...sel(planOpts())},{n:'disc',l:'Discount (₹)',t:'number'},{n:'paid',l:'Amount paid now (₹)',t:'number'},{n:'method',l:'Payment method',...sel([['Cash'],['UPI'],['Card']])}];
const trOpts=()=>[['','None'],...db.trainers.map(t=>[t.id,t.name])];
const wkOpts=()=>[['','None'],...db.workouts.map(w=>[w.id,w.name])];
const memFields=()=>[{n:'name',l:'Full name',r:1},{n:'phone',l:'Phone (10 digits)',r:1},{n:'email',l:'Email',t:'email'},{n:'gender',l:'Gender',...sel([['Male'],['Female'],['Other']])},{n:'age',l:'Age',t:'number',r:1},{n:'address',l:'Address',t:'textarea'},{n:'trainerId',l:'Trainer',...sel(trOpts())},{n:'workoutId',l:'Workout plan',...sel(wkOpts())}];
function vMember(d,id){
  d.name=d.name.trim();d.age=+d.age;
  if(!d.name)return'Name is required';
  if(!/^\d{10}$/.test(d.phone))return'Phone must be exactly 10 digits';
  if(db.members.some(m=>m.phone==d.phone&&m.id!=id))return'A member with this phone already exists';
  if(!(d.age>=10&&d.age<=100))return'Enter a valid age';
}

// ---------- members ----------
let q='';
const mlist=()=>{const s=q.toLowerCase();
  return tbl(['Name','Phone','Plan','Status','Payment','Trainer','Actions'],db.members.filter(m=>m.name.toLowerCase().includes(s)||m.phone.includes(s)).map(m=>{
    const ms=lastMs(m.id),pl=ms&&by(db.plans,ms.planId),tr=by(db.trainers,m.trainerId);
    return `<tr><td>${e(m.name)}</td><td>${e(m.phone)}</td><td>${pl?e(pl.name):'-'}</td><td>${badge(mst(ms))}</td><td>${ms?badge(pst(ms)):'-'}</td><td>${tr?e(tr.name):'-'}</td><td class="act"><button onclick="viewM(${m.id})">View</button><button onclick="renew(${m.id})">Renew</button><button onclick="edit_members(${m.id})">Edit</button><button class="d" onclick="del('members',${m.id})">Delete</button></td></tr>`}).join(''))};
function add_member(){
  openForm('Add Member',[...memFields(),...payFields()],{},d=>{
    const er=vMember(d);if(er)return er;
    if(!db.plans.length)return'Create a membership plan first';
    const m={id:nid('members'),name:d.name,phone:d.phone,email:d.email,gender:d.gender,age:d.age,address:d.address,trainerId:d.trainerId,workoutId:d.workoutId};
    const er2=addMs(m.id,d);if(er2)return er2;db.members.push(m);
  });
}
const edit_members=id=>ed('members','Member',memFields(),id,vMember);
const renew=id=>openForm('Renew / Assign Plan',payFields(),{},d=>addMs(id,d));
function viewM(id){
  const m=by(db.members,id),tr=by(db.trainers,m.trainerId),w=by(db.workouts,m.workoutId);
  const ms=db.ms.filter(x=>x.memberId==id).sort((a,b)=>b.start.localeCompare(a.start));
  show(`<h3>${e(m.name)}</h3><p class="muted">${e(m.gender)}, ${m.age} yrs • ${e(m.phone)} • ${e(m.email||'no email')}<br>${e(m.address||'')}</p>
  <p><b>Trainer:</b> ${tr?e(tr.name):'None'} &nbsp; <b>Workout:</b> ${w?e(w.name):'None'}</p>${w?`<pre>${e(w.exercises)}</pre>`:''}
  <h4>Membership history</h4>${tbl(['Plan','Start','Expiry','Status','Fee','Paid','Balance','Payment'],ms.map(x=>`<tr><td>${e(by(db.plans,x.planId)?.name)}</td><td>${x.start}</td><td>${x.end}</td><td>${badge(mst(x))}</td><td>${inr(x.fee-x.disc)}</td><td>${inr(paid(x))}</td><td>${inr(bal(x))}</td><td>${badge(pst(x))}</td></tr>`).join(''))}
  <h4>Payment history</h4>${tbl(['Date','Amount','Method',''],db.pay.filter(p=>p.memberId==id).map(p=>`<tr><td>${p.date}</td><td>${inr(p.amount)}</td><td>${p.method}</td><td class="act"><button onclick="rcpt(${p.id})">Receipt</button></td></tr>`).join(''))}
  <div class="row">${closeB}</div>`);
}

// ---------- plans / trainers / workouts / admins ----------
const planF=[{n:'name',l:'Plan name',r:1},{n:'days',l:'Duration (days)',t:'number',r:1},{n:'price',l:'Price (₹)',t:'number',r:1}];
const edit_plans=id=>ed('plans','Plan',planF,id,d=>{d.days=+d.days;d.price=+d.price;if(d.days<1||d.price<0)return'Enter valid duration and price';if(db.plans.some(p=>p.name.toLowerCase()==d.name.toLowerCase()&&p.id!=id))return'Plan name already exists'});
const trF=[{n:'name',l:'Name',r:1},{n:'phone',l:'Phone (10 digits)',r:1},{n:'email',l:'Email',t:'email'},{n:'spec',l:'Specialization'},{n:'salary',l:'Salary (₹)',t:'number'}];
const edit_trainers=id=>ed('trainers','Trainer',trF,id,d=>{d.salary=+d.salary||0;if(!/^\d{10}$/.test(d.phone))return'Phone must be 10 digits';if(db.trainers.some(t=>t.phone==d.phone&&t.id!=id))return'Trainer phone already exists'});
const edit_admins=id=>ed('admins','Admin',id?[{n:'password',l:'New password',t:'password',r:1}]:[{n:'username',l:'Username',r:1},{n:'password',l:'Password (min 6 characters)',t:'password',r:1}],id,d=>{if(!id){d.username=d.username.trim();if(d.username.length<3)return'Username must be at least 3 characters';if(db.admins.some(a=>a.username.toLowerCase()==d.username.toLowerCase()))return'Username already exists'}if(d.password.length<6)return'Password must be at least 6 characters'});
const wkF=[{n:'name',l:'Plan name',r:1},{n:'description',l:'Description'},{n:'exercises',l:'Exercises (one per line)',t:'textarea'},{n:'duration',l:'Duration (e.g. 4 weeks)'}];
const edit_workouts=id=>ed('workouts','Workout Plan',wkF,id,d=>{if(db.workouts.some(w=>w.name.toLowerCase()==d.name.toLowerCase()&&w.id!=id))return'Workout name already exists'});

// ---------- payments ----------
function addPay(msId){
  const m=by(db.ms,msId);
  openForm(`Add Payment (balance ${inr(bal(m))})`,[{n:'amount',l:'Amount (₹)',t:'number',r:1},{n:'method',l:'Method',...sel([['Cash'],['UPI'],['Card']])}],{},d=>{
    const a=+d.amount;if(!(a>0)||a>bal(m))return'Amount must be between 1 and the remaining balance';
    db.pay.push({id:nid('pay'),msId,memberId:m.memberId,amount:a,date:today(),method:d.method});
  });
}
function rcpt(id){
  const p=by(db.pay,id),m=by(db.members,p.memberId),ms=by(db.ms,p.msId),pl=by(db.plans,ms.planId);
  show(`<div class="rc"><h3>🏋️ IronPulse Gym – Payment Receipt</h3><p>Receipt #: <b>R${1000+p.id}</b> &nbsp; Date: ${p.date}</p><p>Member: <b>${e(m.name)}</b> (${e(m.phone)})</p><p>Plan: ${e(pl.name)} (${ms.start} to ${ms.end})</p>
  <p>Total fee: ${inr(ms.fee)} | Discount: ${inr(ms.disc)}</p><p>Amount paid now: <b>${inr(p.amount)}</b> via ${p.method}</p><p>Total paid so far: ${inr(paid(ms))} | Balance: ${inr(bal(ms))} | Status: ${pst(ms)}</p></div>
  <div class="row"><button class="btn" onclick="printEl('dlg')">Print</button>${closeB}</div>`);
}

// ---------- pages ----------
const T={dashboard:'Dashboard',members:'Members',plans:'Membership Plans',payments:'Fees & Payments',trainers:'Trainers',workouts:'Workout Plans',reports:'Reports',admins:'Admin Accounts'};
let R={from:addDays(today(),-29),to:today()};
const setR=n=>{R={from:addDays(today(),-n),to:today()};render()};
const P={
admins:()=>`<div class="bar"><button class="btn" onclick="edit_admins()">+ Create New Admin</button></div>`+tbl(['Username','Actions'],db.admins.map(a=>`<tr><td>${e(a.username)}${a.username==sessionStorage.in?' <span class="muted">(you)</span>':''}</td><td class="act"><button onclick="edit_admins(${a.id})">Change password</button><button class="d" onclick="del('admins',${a.id})">Delete</button></td></tr>`).join('')),
dashboard(){
  const st=db.members.map(m=>mst(lastMs(m.id)));
  const pend=db.ms.filter(m=>bal(m)>0),coll=db.pay.reduce((s,p)=>s+p.amount,0);
  const c=(i,l,v,h)=>`<a href="#${h}" style="text-decoration:none;color:inherit"><div class="card"><span>${i}</span><div><h2>${v}</h2><p>${l}</p></div></div></a>`;
  return `<div class="cards">${c('👥','Total members',db.members.length,'members')}${c('✅','Active memberships',st.filter(s=>s=='Active').length,'reports')}${c('⌛','Expired memberships',st.filter(s=>s=='Expired').length,'reports')}${c('🧑‍🏫','Total trainers',db.trainers.length,'trainers')}${c('⏳','Pending payments',pend.length+' ('+inr(pend.reduce((s,m)=>s+bal(m),0))+')','payments')}${c('💰','Total fee collection',inr(coll),'payments')}</div>
  <h3>Recent payments</h3>${tbl(['Date','Member','Amount','Method'],[...db.pay].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).slice(0,5).map(p=>`<tr><td>${p.date}</td><td>${e(by(db.members,p.memberId)?.name)}</td><td>${inr(p.amount)}</td><td>${p.method}</td></tr>`).join(''))}`;
},
members:()=>`<div class="bar"><input placeholder="Search by name or phone" value="${e(q)}" oninput="q=this.value;$('#mt').innerHTML=mlist()"><button class="btn" onclick="add_member()">+ Add Member</button></div><div id="mt">${mlist()}</div>`,
plans:()=>`<div class="bar"><button class="btn" onclick="edit_plans()">+ Add Plan</button></div>`+tbl(['Plan','Duration','Price','Members','Actions'],db.plans.map(p=>`<tr><td>${e(p.name)}</td><td>${p.days} days</td><td>${inr(p.price)}</td><td>${db.ms.filter(m=>m.planId==p.id).length}</td>${actBtns('plans',p.id)}</tr>`).join('')),
payments:()=>`<h3>Membership fees</h3>`+tbl(['Member','Plan','Fee','Discount','Paid','Balance','Status',''],db.ms.map(m=>`<tr><td>${e(by(db.members,m.memberId)?.name)}</td><td>${e(by(db.plans,m.planId)?.name)}</td><td>${inr(m.fee)}</td><td>${inr(m.disc)}</td><td>${inr(paid(m))}</td><td>${inr(bal(m))}</td><td>${badge(pst(m))}</td><td class="act">${bal(m)>0?`<button onclick="addPay(${m.id})">Add payment</button>`:''}</td></tr>`).join(''))
  +`<h3>Payment history</h3>`+tbl(['Receipt','Date','Member','Amount','Method',''],[...db.pay].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).map(p=>`<tr><td>R${1000+p.id}</td><td>${p.date}</td><td>${e(by(db.members,p.memberId)?.name)}</td><td>${inr(p.amount)}</td><td>${p.method}</td><td class="act"><button onclick="rcpt(${p.id})">Receipt</button></td></tr>`).join('')),
trainers:()=>`<div class="bar"><button class="btn" onclick="edit_trainers()">+ Add Trainer</button></div>`+tbl(['Name','Phone','Email','Specialization','Salary','Assigned members','Actions'],db.trainers.map(t=>`<tr><td>${e(t.name)}</td><td>${e(t.phone)}</td><td>${e(t.email)}</td><td>${e(t.spec)}</td><td>${inr(t.salary)}</td><td>${e(db.members.filter(m=>m.trainerId==t.id).map(m=>m.name).join(', ')||'-')}</td>${actBtns('trainers',t.id)}</tr>`).join('')),
workouts:()=>`<div class="bar"><button class="btn" onclick="edit_workouts()">+ Add Workout Plan</button><span class="muted">Assign a workout to a member from Members → Edit.</span></div>`+tbl(['Plan','Description','Exercises','Duration','Assigned to','Actions'],db.workouts.map(w=>`<tr><td>${e(w.name)}</td><td>${e(w.description)}</td><td><pre>${e(w.exercises)}</pre></td><td>${e(w.duration)}</td><td>${e(db.members.filter(m=>m.workoutId==w.id).map(m=>m.name).join(', ')||'-')}</td>${actBtns('workouts',w.id)}</tr>`).join('')),
reports(){
  const pays=db.pay.filter(p=>p.date>=R.from&&p.date<=R.to),sum=pays.reduce((s,p)=>s+p.amount,0);
  return `<div class="bar noprint"><button class="btn g" onclick="setR(0)">Daily</button><button class="btn g" onclick="setR(6)">Weekly</button><button class="btn g" onclick="setR(29)">Monthly</button>
  From <input type="date" value="${R.from}" onchange="R.from=this.value;render()" style="width:auto"> To <input type="date" value="${R.to}" onchange="R.to=this.value;render()" style="width:auto"><button class="btn" onclick="printEl('page')">🖨 Print</button></div>
  <h3>Payment report (${R.from} to ${R.to}) – Total collected: ${inr(sum)}</h3>`+tbl(['Date','Member','Amount','Method'],pays.map(p=>`<tr><td>${p.date}</td><td>${e(by(db.members,p.memberId)?.name)}</td><td>${inr(p.amount)}</td><td>${p.method}</td></tr>`).join(''))
  +`<h3>Pending payments</h3>`+tbl(['Member','Plan','Balance','Status'],db.ms.filter(m=>bal(m)>0).map(m=>`<tr><td>${e(by(db.members,m.memberId)?.name)}</td><td>${e(by(db.plans,m.planId)?.name)}</td><td>${inr(bal(m))}</td><td>${badge(pst(m))}</td></tr>`).join(''))
  +`<h3>Active &amp; expired memberships</h3>`+tbl(['Member','Plan','Start','Expiry','Status'],db.members.map(m=>[m,lastMs(m.id)]).filter(x=>x[1]).map(([m,s])=>`<tr><td>${e(m.name)}</td><td>${e(by(db.plans,s.planId)?.name)}</td><td>${s.start}</td><td>${s.end}</td><td>${badge(mst(s))}</td></tr>`).join(''));
}};

// ---------- app shell ----------
function render(){
  if(!sessionStorage.in){$('#login').hidden=false;$('#app').hidden=true;return}   // block pages without login
  $('#login').hidden=true;$('#app').hidden=false;
  const p=P[location.hash.slice(1)]?location.hash.slice(1):'dashboard';
  document.querySelectorAll('nav a[data-p]').forEach(a=>a.classList.toggle('on',a.dataset.p==p));
  $('#title').textContent=T[p];$('#who').textContent='👤 '+sessionStorage.in;
  $('#view').innerHTML=P[p]();
}
$('#lf').onsubmit=ev=>{ev.preventDefault();
  const a=db.admins.find(x=>x.username==$('#u').value.trim()&&x.password==$('#p').value);
  if(a){sessionStorage.in=a.username;$('#lerr').textContent='';render()}
  else $('#lerr').textContent='Invalid username or password'};
const logout=()=>{sessionStorage.removeItem('in');$('#p').value='';render()};
onhashchange=render;render();