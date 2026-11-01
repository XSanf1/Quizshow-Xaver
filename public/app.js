const socket = io();
const $ = id => document.getElementById(id);
let state = null, myId = null, isHost = false, myCode = "";
const DEFAULT_POINTS = [100,200,300,400,500];
const starterCategories = [
 {name:"Gaming",questions:[
  {points:100,question:"Welcher Minecraft-Gegner explodiert, wenn er nahe genug an einen Spieler kommt?",answer:"Creeper"},
  {points:200,question:"Wie viele Bücherregale werden für die höchste Stufe eines normalen Verzauberungstisches benötigt?",answer:"15"},
  {points:300,question:"Welcher Gegenstand wird benötigt, um einen Netherite-Barren herzustellen?",answer:"Netherit-Schrott und Goldbarren (je 4)"},
  {points:400,question:"Wie heißt der seltene Biomtyp, in dem in Minecraft rosa Kirschbäume wachsen?",answer:"Kirschhain (Cherry Grove)"},
  {points:500,question:"Wie viele Enderaugen können maximal in einem Endportalrahmen bereits eingesetzt sein, wenn das Portal noch nicht aktiviert ist?",answer:"12"}
 ]},
 {name:"Allgemeinwissen",questions:[
  {points:100,question:"Wie viele Kontinente gibt es im üblichen Sieben-Kontinente-Modell?",answer:"7"},
  {points:200,question:"Welche Stadt liegt an der Bosporus-Meerenge und auf zwei Kontinenten?",answer:"Istanbul"},
  {points:300,question:"Wie heißt die Hauptstadt von Kanada?",answer:"Ottawa"},
  {points:400,question:"Welches Land hat flächenmäßig die meisten Zeitzonen, wenn Überseegebiete mitgezählt werden?",answer:"Frankreich"},
  {points:500,question:"Wie heißt die tiefste bekannte Stelle der Weltmeere?",answer:"Challengertief im Marianengraben"}
 ]},
 {name:"Sport",questions:[
  {points:100,question:"Wie viele Spieler stehen bei einer Basketballmannschaft gleichzeitig auf dem Feld?",answer:"5"},
  {points:200,question:"Wie lang ist ein olympisches Schwimmbecken?",answer:"50 Meter"},
  {points:300,question:"In welcher Sportart gibt es die Wertung 'Ippon'?",answer:"Judo"},
  {points:400,question:"Wie viele Punkte zählt ein Touchdown im American Football vor dem Zusatzversuch?",answer:"6"},
  {points:500,question:"Welche drei Disziplinen gehören zum klassischen Triathlon?",answer:"Schwimmen, Radfahren und Laufen"}
 ]},
 {name:"Filme & Serien",questions:[
  {points:100,question:"Wie heißt die Schule für Hexerei in Harry Potter?",answer:"Hogwarts"},
  {points:200,question:"Wie heißt der Heimatplanet von Superman?",answer:"Krypton"},
  {points:300,question:"Wer führte Regie bei Jurassic Park (1993)?",answer:"Steven Spielberg"},
  {points:400,question:"Wie heißt die fiktive Stadt, in der Batman meistens Verbrechen bekämpft?",answer:"Gotham City"},
  {points:500,question:"Wie heißt der erste abendfüllende computeranimierte Spielfilm von Pixar aus dem Jahr 1995?",answer:"Toy Story"}
 ]},
 {name:"YouTube & Internet",questions:[
  {points:100,question:"Wie nennt man das Vorschaubild eines Videos?",answer:"Thumbnail"},
  {points:200,question:"Wofür steht die Abkürzung 'URL'?",answer:"Uniform Resource Locator"},
  {points:300,question:"Wie nennt man eine absichtlich irreführende Überschrift, die zum Klicken verleiten soll?",answer:"Clickbait"},
  {points:400,question:"Wie heißt das Verfahren, bei dem ein Nutzer seine Identität mit einem zweiten Faktor bestätigt?",answer:"Zwei-Faktor-Authentifizierung (2FA)"},
  {points:500,question:"Wie nennt man ein Internetprotokoll, das Webseiten verschlüsselt überträgt und meist an einem Schloss-Symbol erkennbar ist?",answer:"HTTPS"}
 ]},
 {name:"Naturwissenschaften",questions:[
  {points:100,question:"Welches chemische Symbol hat Gold?",answer:"Au"},
  {points:200,question:"Wie heißt der Vorgang, bei dem Pflanzen Lichtenergie in chemische Energie umwandeln?",answer:"Photosynthese"},
  {points:300,question:"Welches Gas macht den größten Anteil der Erdatmosphäre aus?",answer:"Stickstoff"},
  {points:400,question:"Wie nennt man die Einheit der elektrischen Widerstandsmessung?",answer:"Ohm"},
  {points:500,question:"Wie heißt die Grenze um ein Schwarzes Loch, ab der nicht einmal Licht entkommen kann?",answer:"Ereignishorizont"}
 ]}
];
function cloneStarter(){return JSON.parse(JSON.stringify(starterCategories));}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600);}
function emitCreate(name,password){socket.emit("createRoom",{name,password,categories:cloneStarter()});}
$("createForm").addEventListener("submit",e=>{e.preventDefault();$("lobbyError").textContent="";emitCreate($("hostName").value,$("hostPassword").value);});
$("joinForm").addEventListener("submit",e=>{e.preventDefault();$("lobbyError").textContent="";socket.emit("joinRoom",{name:$("joinName").value,code:$("joinCode").value});});
socket.on("connect",()=>{myId=socket.id;});
socket.on("joined",data=>{myCode=data.code;isHost=data.host;$("lobby").hidden=true;$("game").hidden=false;$("roomLabel").textContent="Spielcode: "+myCode;$("codeDisplay").textContent=myCode;$("roleBadge").textContent=isHost?"SPIELLEITUNG":"SPIELER";$("editBtn").hidden=!isHost;$("resetBtn").hidden=!isHost;toast(isHost?"Runde erstellt! Teile den Spielcode.":"Du bist im Spiel!");});
socket.on("errorMessage",msg=>{$("lobbyError").textContent=msg;toast(msg);});
socket.on("state",s=>{state=s;render();});
function render(){
 if(!state)return;
 $("notice").textContent=state.message;
 $("codeDisplay").textContent=state.code;
 $("roleBadge").textContent=state.hostId===myId?"SPIELLEITUNG":"SPIELER";
 isHost=state.hostId===myId;
 $("editBtn").hidden=!isHost;$("resetBtn").hidden=!isHost;
 const boardMode=state.status==="board";
 $("questionScoreRow").hidden=boardMode||!isHost;
 $("boardSection").hidden=!boardMode;
 $("assignRow").hidden=!boardMode||!isHost;
 renderTargetPlayers();$("questionSection").hidden=boardMode;
 renderBoard();renderPlayers();
 if(!boardMode && state.activeQuestion){
  $("questionMeta").textContent=`${state.activeQuestion.category}  •  ${state.activeQuestion.points} PUNKTE`;
  $("questionText").textContent=state.activeQuestion.question;
  const answer = state.hostAnswer || state.activeQuestion.answer;
  $("answerText").textContent=(isHost && !state.answerShown ? "Lösung (nur Spielleitung): " : "Lösung: ") + (answer || "");
  $("answerText").hidden=!(isHost || state.answerShown);
  $("hostControls").hidden=!isHost;
  $("questionScoreRow").hidden=!isHost;
  renderQuestionScorer();
  const winner=state.players.find(p=>p.id===state.buzzWinner);
  $("buzzBtn").disabled=!state.buzzOpen || !!state.buzzWinner || state.hostId===myId || (state.attemptedPlayers||[]).includes(myId);
  $("buzzStatus").textContent=winner?`${winner.name} hat zuerst gebuzzert!`:((state.attemptedPlayers||[]).includes(myId)?"Du hast bei dieser Frage schon falsch geantwortet und bist gesperrt.":state.buzzOpen?"Buzzer ist freigegeben – drück jetzt!":"Warte auf die Freigabe …");
  $("openBtn").disabled=!!state.buzzWinner || state.buzzOpen;
  $("againBtn").hidden=false;
  $("againBtn").textContent="Zurück zur Übersicht";
  $("rightBtn").disabled=!!state.answerShown;
  $("wrongBtn").disabled=!!state.answerShown;
  $("openBtn").disabled=!!state.buzzWinner || state.buzzOpen || !!state.answerShown;
  $("buzzBtn").disabled=!!state.answerShown || !state.buzzOpen || !!state.buzzWinner || state.hostId===myId || (state.attemptedPlayers||[]).includes(myId);
  $("timerBtn").hidden=!isHost;
  $("timerDisplay").hidden=!state.timerEndAt;
 }
 renderTimer();
}
function renderTargetPlayers(){
 const select=$("targetPlayer");
 const current=select.value;
 select.innerHTML="";
 const open=document.createElement("option");open.value="";open.textContent="Offen für alle (Buzzer entscheidet)";select.appendChild(open);
 (state?.players||[]).forEach(p=>{
  const option=document.createElement("option");option.value=p.id;option.textContent=p.name+(p.id===myId?" (du)":"");select.appendChild(option);
 });
 if([...select.options].some(o=>o.value===current))select.value=current;
}
function renderQuestionScorer(){
 const select=$("questionScorer");
 const current=state?.activeQuestion?.assignedPlayerId || state?.buzzWinner || "";
 select.innerHTML="";
 const auto=document.createElement("option");auto.value="";auto.textContent="Automatisch: Buzzer-Gewinner";select.appendChild(auto);
 (state?.players||[]).forEach(p=>{
  const option=document.createElement("option");option.value=p.id;option.textContent=p.name+(p.id===myId?" (du)":"");select.appendChild(option);
 });
 select.value=current;
}
function renderBoard(){
 const board=$("board");board.innerHTML="";
 const pointValues=[...new Set(state.categories.flatMap(c=>c.questions.map(q=>Number(q.points))).filter(Number.isFinite))].sort((a,b)=>a-b);
 state.categories.forEach((cat,ci)=>{
  const h=document.createElement("div");h.className="cathead";h.textContent=cat.name;board.appendChild(h);
 });
 pointValues.forEach(points=>state.categories.forEach((cat,ci)=>{
  const b=document.createElement("button");const used=state.used.includes(`${ci}:${points}`);
  b.className="tile"+(used?" used":"");b.textContent=used?"✓":points;
  b.disabled=used||!isHost||state.status!=="board";
  b.title=`${cat.name} – ${points} Punkte`;
  b.addEventListener("click",()=>socket.emit("selectQuestion",{categoryIndex:ci,points,targetPlayerId:$("targetPlayer").value||null}));
  board.appendChild(b);
 }));
}
function renderPlayers(){
 const box=$("players");box.innerHTML="";
 const sorted=[...state.players].sort((a,b)=>b.score-a.score);
 sorted.forEach((p,i)=>{
  const el=document.createElement("div");el.className="player"+(p.id===myId?" me":"")+(p.id===state.buzzWinner?" winner":"");
  const name=document.createElement("span");name.className="playername";name.textContent=(i===0&&p.score>0?"👑 ":"")+p.name+(p.id===myId?" (du)":"");
  const score=document.createElement(isHost?"button":"span");score.className="playerpoints";score.textContent=p.score.toLocaleString("de-DE");
  if(isHost){
   score.type="button";score.title="Klicken, um den Punktestand direkt zu bearbeiten";score.setAttribute("aria-label",`Punktestand von ${p.name} bearbeiten`);
   score.addEventListener("click",()=>{const value=prompt(`Neuer Punktestand für ${p.name}:`,String(p.score));if(value!==null&&value.trim()!==""){const n=Number(value);if(Number.isFinite(n))socket.emit("setPlayerScore",{playerId:p.id,score:n});else toast("Bitte eine gültige Zahl eingeben.");}});
  }
  el.append(name,score);
  if(isHost){
   const controls=document.createElement("div");controls.className="score-edit-controls";
   const minus=document.createElement("button");minus.type="button";minus.className="small danger";minus.textContent="−100";minus.title="100 Punkte abziehen";minus.addEventListener("click",()=>socket.emit("adjustPlayerScore",{playerId:p.id,delta:-100}));
   const plus=document.createElement("button");plus.type="button";plus.className="small secondary";plus.textContent="+100";plus.title="100 Punkte hinzufügen";plus.addEventListener("click",()=>socket.emit("adjustPlayerScore",{playerId:p.id,delta:100}));
   const edit=document.createElement("button");edit.type="button";edit.className="small secondary";edit.textContent="Ändern";edit.addEventListener("click",()=>{const value=prompt(`Neuer Punktestand für ${p.name}:`,String(p.score));if(value!==null&&value.trim()!=="")socket.emit("setPlayerScore",{playerId:p.id,score:Number(value)});});
   controls.append(minus,plus,edit);el.appendChild(controls);
  }
  box.appendChild(el);
 });
}
$("buzzBtn").addEventListener("click",()=>{socket.emit("buzz");$("buzzBtn").disabled=true;});
$("openBtn").addEventListener("click",()=>socket.emit("openBuzzers"));
$("questionScorer").addEventListener("change",()=>socket.emit("setQuestionScorer",{playerId:$("questionScorer").value||null}));
$("rightBtn").addEventListener("click",()=>socket.emit("judge",{correct:true,playerId:$("questionScorer").value||null}));
$("wrongBtn").addEventListener("click",()=>socket.emit("judge",{correct:false,playerId:$("questionScorer").value||null}));
$("againBtn").addEventListener("click",()=>socket.emit("endQuestion"));
$("timerBtn").addEventListener("click",()=>socket.emit("startTimer"));
let timerInterval=null;
function renderTimer(){ if(timerInterval) clearInterval(timerInterval); const el=$("timerDisplay"); if(!state?.timerEndAt){el.textContent="";el.hidden=true;return;} el.hidden=false; const tick=()=>{const left=Math.max(0,Math.ceil((state.timerEndAt-Date.now())/1000));el.textContent=`⏱ ${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}`;if(left<=0){clearInterval(timerInterval);timerInterval=null;}};tick();timerInterval=setInterval(tick,250); }
$("resetBtn").addEventListener("click",()=>{if(confirm("Punkte und benutzte Fragen wirklich zurücksetzen?"))socket.emit("resetScores");});

$("shuffleBtn").addEventListener("click",()=>{
 if(!isHost || state?.status!=="board") return;
 if(!confirm("Kategorien und Fragen zufällig mischen? Bereits verwendete Fragen werden zurückgesetzt.")) return;
 socket.emit("shuffleCategories");
});
$("editBtn").addEventListener("click",()=>{buildEditor();$("editor").hidden=false;$("editor").scrollIntoView({behavior:"smooth"});});
$("closeEditor").addEventListener("click",()=>$("editor").hidden=true);
function buildEditor(){
 const box=$("editorFields");box.innerHTML="";
 state.categories.forEach((cat,ci)=>{
  const wrap=document.createElement("div");wrap.className="editorcat";
  const title=document.createElement("label");title.textContent="Kategorie "+(ci+1);
  const name=document.createElement("input");name.value=cat.name;name.maxLength=28;name.dataset.category=ci;name.dataset.field="name";title.appendChild(name);wrap.appendChild(title);
  cat.questions.forEach((q,qi)=>{
   const row=document.createElement("div");row.className="editorq";
   const pts=document.createElement("label");pts.className="pointslabel";pts.textContent="Punkte";const pointInput=document.createElement("input");pointInput.type="number";pointInput.min="0";pointInput.max="100000";pointInput.step="1";pointInput.value=q.points;pointInput.dataset.category=ci;pointInput.dataset.question=qi;pointInput.dataset.field="points";pts.appendChild(pointInput);row.appendChild(pts);
   [["Frage", "question"],["Lösung","answer"]].forEach(([labelText,field])=>{
    const lab=document.createElement("label");lab.textContent=labelText;
    const input=document.createElement("input");input.value=q[field];input.dataset.category=ci;input.dataset.question=qi;input.dataset.field=field;input.maxLength=300;lab.appendChild(input);row.appendChild(lab);
   });
   wrap.appendChild(row);
  });
  box.appendChild(wrap);
 });
}
$("saveEditor").addEventListener("click",()=>{
 const cats=JSON.parse(JSON.stringify(state.categories));
 $("editorFields").querySelectorAll("input").forEach(inp=>{
  const ci=Number(inp.dataset.category),field=inp.dataset.field;
  if(field==="name")cats[ci].name=inp.value.trim()||`Kategorie ${ci+1}`;
  else if(field==="points") cats[ci].questions[Number(inp.dataset.question)].points=Math.max(0,Math.min(100000,Math.trunc(Number(inp.value)||0)));
  else cats[ci].questions[Number(inp.dataset.question)][field]=inp.value.trim();
 });
 if(cats.some(c=>c.questions.some(q=>!q.question||!q.answer))){toast("Bitte jede Frage und Lösung ausfüllen.");return;}
 socket.emit("editCategories",cats);$("editor").hidden=true;toast("Fragen gespeichert.");
});
