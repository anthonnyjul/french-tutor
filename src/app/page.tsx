"use client";

import { useState, useRef, useEffect } from "react";

// ── DATA ──────────────────────────────────────────────────────────────────────

const SCENARIOS = [
  { id:"cafe", emoji:"☕", title:"Au Café", subtitle:"Order coffee & croissants", character:"Marie", role:"Barista at a Parisian café on Rue de Rivoli", difficulty:"A1", color:"from-amber-400 to-orange-500", bg:"bg-amber-50", xp:50,
    setting:"You've just walked into a charming café near the Seine. Marie is behind the counter.",
    starter:"Bonjour ! Bienvenue au Café de Paris. Qu'est-ce que je peux faire pour vous ?",
    starterEn:"Hello! Welcome to Café de Paris. What can I do for you?",
    topics:["greetings","ordering coffee & tea","croissants & pastries","paying the bill","please & thank you"] },
  { id:"restaurant", emoji:"🍽️", title:"Au Restaurant", subtitle:"Read the menu & dine out", character:"Pierre", role:"Waiter at a classic brasserie in Lyon", difficulty:"A2", color:"from-red-400 to-rose-500", bg:"bg-rose-50", xp:65,
    setting:"You're seated at a candlelit brasserie. Pierre approaches your table with the menu.",
    starter:"Bonsoir ! Voici notre carte du soir. Avez-vous des questions sur les plats ?",
    starterEn:"Good evening! Here is our evening menu. Do you have any questions about the dishes?",
    topics:["starters & mains","dietary preferences","wine recommendations","asking prices","requesting the bill"] },
  { id:"directions", emoji:"🗺️", title:"Les Directions", subtitle:"Navigate Paris on foot", character:"Jean", role:"Friendly Parisian near the Louvre", difficulty:"A2", color:"from-sky-400 to-blue-500", bg:"bg-sky-50", xp:65,
    setting:"You're near the Louvre and completely lost. Jean notices you looking at your phone.",
    starter:"Ah, vous avez l'air un peu perdu ! Est-ce que je peux vous aider ?",
    starterEn:"Ah, you look a little lost! Can I help you find something?",
    topics:["left/right/straight ahead","how far & how long","metro stops","landmarks","asking to repeat slowly"] },
  { id:"hotel", emoji:"🏨", title:"À l'Hôtel", subtitle:"Check in & make requests", character:"Sophie", role:"Receptionist at Hôtel Lumière, Marais", difficulty:"A2", color:"from-purple-400 to-violet-500", bg:"bg-purple-50", xp:65,
    setting:"You've arrived at your Paris hotel after a long journey. Sophie is at the front desk.",
    starter:"Bonsoir, bienvenue à l'Hôtel Lumière ! Vous avez une réservation avec nous ?",
    starterEn:"Good evening, welcome to Hôtel Lumière! Do you have a reservation with us?",
    topics:["reservation & name","room type & floor","breakfast included","wifi & facilities","checkout time"] },
  { id:"market", emoji:"💶", title:"Au Marché", subtitle:"Shop & handle euros", character:"Isabelle", role:"Vendor at a Provençal market in Aix", difficulty:"A1", color:"from-emerald-400 to-green-500", bg:"bg-emerald-50", xp:50,
    setting:"A vibrant sunny market in Provence. Isabelle's stall is full of fresh produce.",
    starter:"Bonjour ! Regardez ces beaux fruits frais ! Qu'est-ce qui vous fait envie aujourd'hui ?",
    starterEn:"Hello! Look at these beautiful fresh fruits! What takes your fancy today?",
    topics:["prices & numbers","quantities (un kilo, deux)","euros & giving change","saying too expensive","goodbye"] },
];

const LEVELS = [
  { n:1, name:"Débutant",      icon:"🌱", min:0,    max:200  },
  { n:2, name:"Élémentaire",   icon:"📖", min:200,  max:500  },
  { n:3, name:"Intermédiaire", icon:"🌟", min:500,  max:1000 },
  { n:4, name:"Avancé",        icon:"🏅", min:1000, max:2000 },
  { n:5, name:"Maître",        icon:"🏆", min:2000, max:9999 },
];

const BADGES = [
  { id:"first",           icon:"👋", name:"Premiers Pas",   desc:"Complete your first scenario" },
  { id:"cafe_done",       icon:"☕", name:"Café Expert",     desc:"Finish the café scenario" },
  { id:"restaurant_done", icon:"🍷", name:"Bon Vivant",      desc:"Finish the restaurant scenario" },
  { id:"directions_done", icon:"🧭", name:"Explorateur",     desc:"Master directions" },
  { id:"hotel_done",      icon:"🛎️", name:"Voyageur",        desc:"Check in at the hotel" },
  { id:"market_done",     icon:"🧺", name:"Marchand",        desc:"Shop at the market" },
  { id:"xp_100",          icon:"💯", name:"Centurion",       desc:"Earn 100 XP" },
  { id:"xp_500",          icon:"⚡", name:"En Route!",       desc:"Earn 500 XP" },
  { id:"pronouncer",      icon:"🎤", name:"Bon Accent!",     desc:"Score 80%+ on pronunciation" },
  { id:"all_done",        icon:"🇫🇷", name:"Vive la France!", desc:"Complete all 5 scenarios" },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

const strSim = (a: string, b: string): number => {
  const clean = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z\s]/g,"").trim();
  const aW = clean(a).split(/\s+/).filter(w => w.length > 1);
  const bW = clean(b).split(/\s+/).filter(w => w.length > 1);
  if (!aW.length || !bW.length) return 0;
  const hits = aW.filter(w => bW.some(bw => bw.includes(w) || w.includes(bw))).length;
  return Math.round((hits / Math.max(aW.length, bW.length)) * 100);
};

const getLevel = (xp: number) => [...LEVELS].reverse().find(l => xp >= l.min) || LEVELS[0];
const xpPct    = (xp: number) => { const l = getLevel(xp); return Math.min(100, Math.round(((xp - l.min) / (l.max - l.min)) * 100)); };
const pGrade   = (s: number): [string, string] => s >= 85 ? ["Excellent! 🌟","#16a34a"] : s >= 70 ? ["Bon! 👍","#2563eb"] : s >= 50 ? ["Pas mal 📈","#ca8a04"] : ["Réessayez 🔄","#dc2626"];

const ScoreRing = ({ score, size = 44 }: { score: number; size?: number }) => {
  const c = score >= 80 ? "#16a34a" : score >= 55 ? "#ca8a04" : "#ea580c";
  const r = 16, ci = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{flexShrink:0}}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4"/>
      <circle cx="22" cy="22" r={r} fill="none" stroke={c} strokeWidth="4"
        strokeDasharray={ci} strokeDashoffset={ci - ci * score / 100}
        strokeLinecap="round" transform="rotate(-90 22 22)"/>
      <text x="22" y="27" textAnchor="middle" fontSize="10" fontWeight="bold" fill={c}>{score}%</text>
    </svg>
  );
};

// ── TYPES ─────────────────────────────────────────────────────────────────────

type Scenario = typeof SCENARIOS[number];
interface Msg { id: number; who: "user"|"char"; text: string; en?: string; conf?: number; }
interface Feedback {
  score: number; xp: number; praise: string; correction: string|null; correctionNote: string|null;
  pron?: { score: number; grade: string; tip: string; soundFocus: string };
  grammarTip?: { rule: string; example: string; realLife: string };
}

// ── APP ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [view,         setView]         = useState<"dashboard"|"scenario">("dashboard");
  const [scenario,     setScenario]     = useState<Scenario|null>(null);
  const [msgs,         setMsgs]         = useState<Msg[]>([]);
  const [busy,         setBusy]         = useState(false);
  const [listening,    setListening]    = useState(false);
  const [repeatMode,   setRepeatMode]   = useState<number|null>(null);
  const [repeatResult, setRepeatResult] = useState<{ target:string; heard:string; score:number; conf:number }|null>(null);
  const [fb,           setFb]           = useState<Feedback|null>(null);
  const [hint,         setHint]         = useState<string|null>(null);
  const [speakId,      setSpeakId]      = useState<string|null>(null);
  const [xp,           setXP]           = useState(0);
  const [done,         setDone]         = useState<Set<string>>(new Set());
  const [badges,       setBadges]       = useState<Set<string>>(new Set());
  const [lvlUp,        setLvlUp]        = useState<typeof LEVELS[number]|null>(null);
  const [msgN,         setMsgN]         = useState(0);
  const [xpAnim,       setXpAnim]       = useState<string|null>(null);
  const [micError,     setMicError]     = useState<string|null>(null);
  const [useText,      setUseText]      = useState(false);
  const [inputText,    setInputText]    = useState("");

  const voicesRef     = useRef<SpeechSynthesisVoice[]>([]);
  const recRef        = useRef<SpeechRecognition|null>(null);
  const afterSpeakRef = useRef<(()=>void)|null>(null);
  const endRef        = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, fb, hint, repeatResult, listening]);

  useEffect(() => {
    const load = () => { const v = window.speechSynthesis.getVoices(); if (v.length) voicesRef.current = v; };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => { window.speechSynthesis.removeEventListener("voiceschanged", load); window.speechSynthesis.cancel(); };
  }, []);

  // ── TTS ───────────────────────────────────────────────────────────────────

  const speak = (text: string, id: string, rate = 0.8) => {
    window.speechSynthesis.cancel();
    if (speakId === id) { setSpeakId(null); afterSpeakRef.current = null; return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR"; u.rate = rate; u.pitch = 1.05;
    const vs = voicesRef.current;
    const fr = vs.find(v => v.lang === "fr-FR") || vs.find(v => v.lang === "fr-BE") || vs.find(v => v.lang.startsWith("fr"));
    if (fr) u.voice = fr;
    u.onstart = () => setSpeakId(id);
    u.onend   = () => { setSpeakId(null); afterSpeakRef.current?.(); afterSpeakRef.current = null; };
    u.onerror = () => { setSpeakId(null); afterSpeakRef.current = null; };
    window.speechSynthesis.speak(u);
  };

  // ── STT ───────────────────────────────────────────────────────────────────

  const startListeningFn = (onResult: (t: string, c: number) => void): boolean => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setMicError("Voice input needs Chrome or Safari — or tap ⌨️ to type."); return false; }
    try { recRef.current?.abort(); } catch(e) {}
    const rec: SpeechRecognition = new SR();
    rec.lang = "fr-FR"; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 3;
    rec.onstart  = () => { setListening(true); setMicError(null); };
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const best = Array.from(e.results[0]).reduce((a: SpeechRecognitionAlternative, b: SpeechRecognitionAlternative) => a.confidence > b.confidence ? a : b);
      setListening(false);
      onResult(best.transcript, best.confidence);
    };
    rec.onerror  = (e: SpeechRecognitionErrorEvent) => {
      setListening(false);
      if      (e.error === "no-speech")   setMicError("No speech detected — tap 🎤 and try again.");
      else if (e.error === "not-allowed") setMicError("Microphone blocked — allow mic in browser settings.");
      else                                setMicError(`Mic error: ${e.error}`);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); return true; }
    catch(e) { setMicError("Couldn't start microphone."); return false; }
  };

  // ── REPEAT-AFTER-ME ───────────────────────────────────────────────────────

  const handleRepeat = (targetText: string, msgId: number) => {
    if (listening || repeatMode) return;
    setRepeatResult(null);
    setRepeatMode(msgId);
    afterSpeakRef.current = () => {
      setTimeout(() => {
        startListeningFn((transcript, confidence) => {
          const sim   = strSim(targetText, transcript);
          const score = Math.round(sim * 0.6 + Math.min(confidence, 0.99) * 100 * 0.4);
          setRepeatResult({ target: targetText, heard: transcript, score, conf: Math.round(confidence * 100) });
          setRepeatMode(null);
          const gain = score >= 80 ? 15 : score >= 55 ? 8 : 4;
          setXP(prev => prev + gain);
          setXpAnim(`+${gain} XP`);
          setTimeout(() => setXpAnim(null), 1800);
          if (score >= 80) setBadges(prev => new Set([...prev, "pronouncer"]));
        });
      }, 350);
    };
    speak(targetText, `rep_${msgId}`, 0.72);
  };

  // ── SEND MESSAGE ──────────────────────────────────────────────────────────

  const sendMessage = async (text: string, confidence = 0.75) => {
    if (!text?.trim() || busy || !scenario) return;
    setMsgs(prev => [...prev, { id: Date.now(), who:"user", text: text.trim(), conf: Math.round(confidence * 100) }]);
    setInputText(""); setBusy(true); setFb(null); setHint(null);

    const history = msgs.map(m => `${m.who === "char" ? scenario.character : "Student"}: ${m.text}`).join("\n");
    const confPct = Math.round(confidence * 100);

    const prompt = `You are ${scenario.character}, ${scenario.role} in France. Help this English speaker (school-level French, A1-A2) practice real conversational French.

Setting: ${scenario.setting}
Topics to weave in naturally: ${scenario.topics.join(", ")}

Conversation so far:
${history}
Student just said: "${text}"
Speech recognition confidence: ${confPct}%

Be warm, encouraging, realistic. Keep French at A1-A2 level. If they used English, gently note they should try French.

Return ONLY valid JSON — no markdown, no code fences, no text outside the JSON:
{
  "characterSays": "your French reply (1-2 natural sentences)",
  "translation": "English translation",
  "feedback": {
    "score": 0,
    "xp": 20,
    "praise": "one specific compliment on what they did well",
    "correction": "corrected French version, or null if perfect",
    "correctionNote": "one-line grammar reason, or null"
  },
  "pronunciationFeedback": {
    "score": 0,
    "grade": "Excellent/Bon/Pas mal/À retravailler",
    "tip": "one specific French pronunciation tip for what they said",
    "soundFocus": "the specific French sound to focus on"
  },
  "grammarTip": {
    "rule": "one bite-sized grammar rule (max 2 sentences, tied to this conversation)",
    "example": "French: '[sentence]' → English: '[translation]'",
    "realLife": "exactly where in daily Paris life you would use this"
  },
  "hint": "what they could naturally say next (in English, one sentence)"
}`;

    try {
      // ↓ Calls YOUR Next.js API route — key stays secret on the server
      const res  = await fetch("/api/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:950, messages:[{ role:"user", content:prompt }] })
      });
      const raw  = await res.json();
      const txt  = raw.content?.find((b: any) => b.type === "text")?.text || "";
      const data = JSON.parse(txt.replace(/```json|```/g,"").trim());

      setMsgs(prev => [...prev, { id:Date.now()+1, who:"char", text:data.characterSays, en:data.translation }]);
      setFb({ ...data.feedback, pron: data.pronunciationFeedback, grammarTip: data.grammarTip });
      setHint(data.hint);

      const gain   = data.feedback?.xp || 20;
      const prevLv = getLevel(xp);
      const newXP  = xp + gain;
      setXP(newXP);
      setXpAnim(`+${gain} XP`);
      setTimeout(() => setXpAnim(null), 1800);
      if (getLevel(newXP).n > prevLv.n) { setLvlUp(getLevel(newXP)); setTimeout(() => setLvlUp(null), 3500); }

      const newN = msgN + 1;
      setMsgN(newN);
      if (newN >= 5 && !done.has(scenario.id)) {
        const nd = new Set([...done, scenario.id]);
        setDone(nd);
        const b = new Set(badges);
        if (nd.size >= 1) b.add("first");
        ["cafe","restaurant","directions","hotel","market"].forEach(id => { if (nd.has(id)) b.add(`${id}_done`); });
        if (newXP >= 100) b.add("xp_100");
        if (newXP >= 500) b.add("xp_500");
        if (nd.size >= 5) b.add("all_done");
        if (data.pronunciationFeedback?.score >= 80) b.add("pronouncer");
        setBadges(b);
      }
    } catch(e) {
      setMsgs(prev => [...prev, { id:Date.now()+1, who:"char", text:"Pardon ? Pouvez-vous répéter, s'il vous plaît ?", en:"Sorry? Could you please repeat that?" }]);
    }
    setBusy(false);
  };

  const startScenario = (s: Scenario) => {
    window.speechSynthesis.cancel();
    setScenario(s);
    setMsgs([{ id:0, who:"char", text:s.starter, en:s.starterEn }]);
    setFb(null); setHint("Tap 🎤 to speak in French. Start with 'Bonjour !' — it's OK to be slow!"); setMsgN(0);
    setRepeatResult(null); setRepeatMode(null); setMicError(null); setInputText(""); setUseText(false);
    setView("scenario");
  };

  // ── DASHBOARD ──────────────────────────────────────────────────────────────

  if (view === "dashboard") {
    const lvl  = getLevel(xp);
    const pct  = xpPct(xp);
    const next = LEVELS.find(l => l.n === lvl.n + 1);
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="bg-gradient-to-br from-blue-700 to-blue-800 text-white px-4 pt-6 pb-5">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight">🇫🇷 Parlez-vous français?</h1>
                <p className="text-blue-200 text-xs mt-0.5">Your 3-month fluency journey · 30 min/day</p>
              </div>
              <div className="bg-white bg-opacity-15 rounded-2xl px-3 py-2 text-center min-w-16">
                <div className="text-2xl leading-none">{lvl.icon}</div>
                <div className="text-xs font-bold mt-1 leading-tight">{lvl.name}</div>
                <div className="text-blue-200 text-xs">Lvl {lvl.n}</div>
              </div>
            </div>
            <div className="h-2.5 bg-blue-900 bg-opacity-60 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-700" style={{width:`${Math.max(pct,3)}%`}}/>
            </div>
            <div className="flex justify-between text-xs text-blue-200">
              <span className="font-semibold">{xp} XP</span>
              {next ? <span>{next.min - xp} XP → {next.icon} {next.name}</span> : <span>Max level! 🏆</span>}
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 -mt-4 mb-5">
            {[[xp,"Total XP","text-blue-600"],[`${done.size}/5`,"Scenarios","text-green-600"],[badges.size,"Badges","text-yellow-500"]].map(([v,l,c]) => (
              <div key={String(l)} className="bg-white rounded-xl p-3 text-center shadow-sm">
                <div className={`text-xl font-bold ${c}`}>{v}</div>
                <div className="text-xs text-gray-500">{l}</div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 mb-5 text-white">
            <p className="font-bold text-sm mb-1">🎯 Your 3-Month Goal</p>
            <p className="text-blue-100 text-xs leading-relaxed">Understand & respond naturally in everyday French — cafés, restaurants, directions, hotels & shopping.</p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {["🎤 Voice input","🔊 Native audio","📊 Pronunciation grading","🎤 Repeat-after-me","💡 Grammar tips","🏅 XP & Badges"].map(t => (
                <span key={t} className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">Choose a scenario</p>
          <div className="space-y-2.5 mb-6">
            {SCENARIOS.map(s => {
              const isDone = done.has(s.id);
              return (
                <button key={s.id} onClick={() => startScenario(s)}
                  className="w-full bg-white rounded-2xl p-3.5 text-left shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all active:scale-99">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl flex-shrink-0`}>{s.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">{s.title}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{s.difficulty}</span>
                        {isDone && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">✓ Done</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{s.subtitle} · with {s.character}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{s.topics.slice(0,3).join(" · ")}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-bold text-yellow-500">+{s.xp}</div>
                      <div className="text-xs text-gray-400">XP</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">Badges — {badges.size}/{BADGES.length} earned</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {BADGES.map(b => {
              const earned = badges.has(b.id);
              return (
                <div key={b.id} title={b.desc}
                  className={`rounded-xl p-2.5 text-center transition-all ${earned ? "bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 shadow-sm" : "bg-gray-100 opacity-40"}`}>
                  <div className="text-2xl mb-1">{earned ? b.icon : "🔒"}</div>
                  <div className="text-xs font-semibold text-gray-700 leading-tight">{b.name}</div>
                  {earned && <div className="text-xs text-gray-400 mt-0.5 leading-tight">{b.desc}</div>}
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
            <strong>🎤 Voice tips:</strong> Works best in Chrome. Speak clearly and a little slower than normal — French vowels take practice! Tap <strong>🎤 Repeat</strong> on any character bubble to practice that exact phrase.
          </div>
        </div>
      </div>
    );
  }

  // ── SCENARIO ───────────────────────────────────────────────────────────────

  if (view === "scenario" && scenario) {
    const lvl        = getLevel(xp);
    const pct        = xpPct(xp);
    const isComplete = msgN >= 5 && done.has(scenario.id);

    return (
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        <div className={`bg-gradient-to-r ${scenario.color} text-white px-3 py-3 flex-shrink-0`}>
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <button onClick={() => { setView("dashboard"); window.speechSynthesis.cancel(); try { recRef.current?.abort(); } catch(e) {} }}
              className="w-8 h-8 flex items-center justify-center bg-white bg-opacity-20 rounded-full font-bold text-lg hover:bg-opacity-30 flex-shrink-0">‹</button>
            <span className="text-xl flex-shrink-0">{scenario.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-tight">{scenario.title}</div>
              <div className="text-white text-opacity-75 text-xs truncate">{scenario.setting}</div>
            </div>
            <div className="flex-shrink-0 text-xs text-right">
              <div className="font-bold">{xp} XP {lvl.icon}</div>
              <div className="h-1.5 w-14 bg-white bg-opacity-30 rounded-full mt-1">
                <div className="h-full bg-white rounded-full transition-all" style={{width:`${Math.max(pct,3)}%`}}/>
              </div>
            </div>
          </div>
        </div>

        <div className={`${scenario.bg} border-b border-gray-200 px-3 py-2 flex-shrink-0`}>
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${scenario.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>{scenario.character[0]}</div>
            <div className="text-xs flex-1 truncate"><span className="font-semibold text-gray-700">{scenario.character}</span><span className="text-gray-400"> · {scenario.role}</span></div>
            <div className="text-xs text-gray-400 flex-shrink-0">🔊 listen · 🎤 repeat</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="max-w-lg mx-auto space-y-3">
            {msgs.map(m => (
              <div key={m.id} className={`flex ${m.who === "user" ? "justify-end" : "justify-start"}`}>
                {m.who === "char" ? (
                  <div className="max-w-[90%]">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-800 font-medium">{m.text}</p>
                      {m.en && <p className="text-xs text-gray-400 italic mt-1.5 pt-1.5 border-t border-gray-50">{m.en}</p>}
                      <div className="flex gap-2 mt-2.5 flex-wrap">
                        <button onClick={() => speak(m.text, String(m.id))}
                          className={`text-xs px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${speakId === String(m.id) ? "bg-blue-100 text-blue-600 font-medium" : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-500"}`}>
                          {speakId === String(m.id) ? "⏸ Playing…" : "🔊 Listen"}
                        </button>
                        <button onClick={() => handleRepeat(m.text, m.id)}
                          disabled={!!repeatMode || listening}
                          className={`text-xs px-2.5 py-1 rounded-full transition-all flex items-center gap-1 disabled:opacity-40 ${
                            repeatMode === m.id && listening ? "bg-red-100 text-red-600 font-medium animate-pulse"
                            : repeatMode === m.id ? "bg-orange-100 text-orange-600 font-medium"
                            : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"}`}>
                          {repeatMode === m.id && listening ? "🎤 Speak now!" : repeatMode === m.id ? "🔊 Listen first…" : "🎤 Repeat"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[90%]">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 shadow-sm">
                      <p className="text-sm">{m.text}</p>
                      {m.conf !== undefined && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="h-1 flex-1 bg-blue-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-200 rounded-full" style={{width:`${m.conf}%`}}/>
                          </div>
                          <span className="text-blue-200 text-xs flex-shrink-0">{m.conf}% recognised</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {repeatResult && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3.5">
                <p className="text-xs font-bold text-gray-700 mb-2.5">🎤 Pronunciation Check — Repeat After Me</p>
                <div className="flex items-center gap-3 mb-3">
                  <ScoreRing score={repeatResult.score}/>
                  <div>
                    {(() => { const [g,c] = pGrade(repeatResult.score); return <p className="font-bold text-sm" style={{color:c}}>{g}</p>; })()}
                    <p className="text-xs text-gray-400">Recognition confidence: {repeatResult.conf}%</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-2">
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">🎯 Target phrase</p>
                    <p className="text-sm text-gray-800 font-medium italic">&ldquo;{repeatResult.target}&rdquo;</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${repeatResult.score >= 70 ? "bg-green-50" : "bg-orange-50"}`}>
                    <p className="text-xs text-gray-400 mb-0.5">👂 What was heard</p>
                    <p className={`text-sm font-medium italic ${repeatResult.score >= 70 ? "text-green-800" : "text-orange-800"}`}>&ldquo;{repeatResult.heard}&rdquo;</p>
                  </div>
                </div>
                {repeatResult.score < 80 && (
                  <button onClick={() => setRepeatResult(null)} className="text-xs text-blue-600 hover:text-blue-700 font-medium underline">Try again →</button>
                )}
              </div>
            )}

            {busy && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-1.5">
                    {[0,0.15,0.3].map((d,i) => <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay:`${d}s`}}/>)}
                    <span className="text-xs text-gray-400 ml-1">{scenario.character} is thinking…</span>
                  </div>
                </div>
              </div>
            )}

            {fb && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ScoreRing score={fb.score}/>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">French Quality</p>
                      <p className="text-xs text-gray-500 leading-snug max-w-[176px]">{fb.praise}</p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl px-3 py-2 border border-yellow-100 text-right flex-shrink-0">
                    <div className="text-yellow-600 font-bold text-lg leading-tight">+{fb.xp}</div>
                    <div className="text-yellow-500 text-xs font-medium">XP</div>
                  </div>
                </div>

                {fb.pron && (
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5">
                    <div className="flex items-center gap-2.5">
                      <ScoreRing score={fb.pron.score} size={40}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-purple-700">Pronunciation</p>
                          <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">{fb.pron.grade}</span>
                        </div>
                        <p className="text-xs text-purple-600 mt-0.5 leading-snug">{fb.pron.tip}</p>
                        {fb.pron.soundFocus && <p className="text-xs text-purple-400 mt-0.5">🎯 Focus on: {fb.pron.soundFocus}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {fb.correction && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5">
                    <p className="text-xs font-semibold text-orange-600 mb-1">✏️ Better version</p>
                    <p className="text-sm text-gray-800 font-medium italic">&ldquo;{fb.correction}&rdquo;</p>
                    {fb.correctionNote && <p className="text-xs text-gray-500 mt-1">{fb.correctionNote}</p>}
                  </div>
                )}

                {fb.grammarTip && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5">
                    <p className="text-xs font-semibold text-blue-600 mb-1">💡 Grammar tip</p>
                    <p className="text-xs text-gray-700 leading-snug">{fb.grammarTip.rule}</p>
                    <p className="text-xs font-semibold text-blue-700 mt-1.5 leading-snug">👉 {fb.grammarTip.example}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">🗼 {fb.grammarTip.realLife}</p>
                  </div>
                )}
              </div>
            )}

            {hint && !busy && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-2.5">
                <p className="text-xs font-semibold text-yellow-700 mb-0.5">💭 What to say next</p>
                <p className="text-xs text-gray-600 leading-snug">{hint}</p>
              </div>
            )}

            {isComplete && (
              <div className={`bg-gradient-to-r ${scenario.color} text-white rounded-2xl p-4 text-center shadow-md`}>
                <div className="text-3xl mb-1">🎉</div>
                <div className="font-bold text-base mb-1">Scenario Complete!</div>
                <p className="text-white text-opacity-90 text-xs mb-3">Badge earned! Keep practising or try another scenario.</p>
                <button onClick={() => { setView("dashboard"); window.speechSynthesis.cancel(); }}
                  className="bg-white bg-opacity-25 hover:bg-opacity-35 text-white text-xs font-bold px-5 py-2 rounded-full transition-colors">
                  Back to Dashboard →
                </button>
              </div>
            )}
            <div ref={endRef}/>
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 px-3 py-3 flex-shrink-0">
          <div className="max-w-lg mx-auto">
            {micError && <div className="mb-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 text-xs text-red-600">{micError}</div>}
            {useText ? (
              <div className="flex gap-2 items-center">
                <button onClick={() => setUseText(false)} title="Switch to voice"
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-base flex-shrink-0">🎤</button>
                <input ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage(inputText, 0.7)}
                  placeholder="Tapez en français…" disabled={busy}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"/>
                <button onClick={() => sendMessage(inputText, 0.7)} disabled={busy || !inputText.trim()}
                  className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0 shadow-sm transition-colors">▶</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={() => {
                  if (listening) { recRef.current?.stop(); return; }
                  startListeningFn((t, c) => sendMessage(t, c));
                }} disabled={busy || !!repeatMode}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all active:scale-95 ${
                    listening ? "bg-red-500 scale-110 shadow-red-200 animate-pulse"
                    : busy    ? "bg-gray-300 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
                  } text-white`}>
                  {listening ? "⏹" : "🎤"}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  {listening ? "Listening… tap to stop" : busy ? "Waiting for response…" : "Tap to speak in French"}
                </p>
                <button onClick={() => { setUseText(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline">⌨️ Type instead</button>
              </div>
            )}
          </div>
        </div>

        {xpAnim && (
          <div className="fixed top-20 right-4 z-50 bg-yellow-400 text-yellow-900 font-bold text-sm px-3 py-1.5 rounded-full shadow-lg pointer-events-none animate-bounce">{xpAnim} ✨</div>
        )}
        {lvlUp && (
          <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none">
            <div className="bg-yellow-400 text-yellow-900 px-5 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-2 animate-bounce">
              🎉 Level Up! You&apos;re now {lvlUp.icon} {lvlUp.name}!
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}