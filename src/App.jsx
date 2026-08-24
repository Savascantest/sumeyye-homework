import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Archive, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp,
  ExternalLink, Glasses, GraduationCap, Headphones, Layers3, ListChecks, LoaderCircle, Puzzle,
  RefreshCw, RotateCcw, Sparkles, Star, Trophy, Volume2,
} from 'lucide-react';

const nav = [
  ['learn', '1. Öğren', BookOpen],
  ['read', '2. Oku', Glasses],
  ['listen', '3. Dinle', Headphones],
  ['sort', '4. Eşleştir', Layers3],
  ['order', '5. Sırala', Puzzle],
  ['quiz', '6. Testler', ListChecks],
];

const roleNames = { S: 'Özne', V: 'Fiil', O: 'Nesne', P: 'Yer', T: 'Zaman', BE: 'BE', AUX: 'Yardımcı Fiil', QW: 'Soru Kelimesi' };

function MarkedText({ text }) {
  if (typeof text !== 'string' || !text.includes('[[')) return text;
  return text.split(/(\[\[(?:S|V|O|P|T|BE|AUX|QW):.*?\]\])/g).map((part, index) => {
    const match = part.match(/^\[\[(S|V|O|P|T|BE|AUX|QW):(.*?)\]\]$/);
    return match ? <mark className={`mark role-${match[1]}`} key={index}>{match[2]}<small>{roleNames[match[1]]}</small></mark> : part;
  });
}

function storageKey(hw) { return `sumeyye-master:${hw.id}`; }
function weekStart(dateString) {
  const date = new Date(`${dateString}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}
function weekLabel(startString) {
  const start = new Date(`${startString}T12:00:00Z`);
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 6);
  const short = (date) => date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${short(start)} – ${short(end)}`;
}
function shuffle(list) { return [...list].map((x) => ({ x, r: Math.random() })).sort((a,b) => a.r-b.r).map(({x}) => x); }
function playTone(frequency, duration=.12) {
  try { const Ctx=window.AudioContext||window.webkitAudioContext; const ctx=new Ctx(); const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.frequency.value=frequency; gain.gain.value=.04; osc.connect(gain); gain.connect(ctx.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration); osc.stop(ctx.currentTime+duration); } catch {}
}

function Confetti({ burst }) {
  if (!burst) return null;
  return <div className="confetti-layer">{Array.from({length:28},(_,i)=><i key={i} style={{'--x':`${(i*37)%100}%`,'--delay':`${(i%7)*.04}s`,'--color':['#facc15','#38bdf8','#fb7185','#4ade80','#a78bfa'][i%5]}} />)}</div>;
}

function Learn({ data }) {
  const [topicId,setTopicId]=useState(data[0]?.id);
  useEffect(()=>setTopicId(data[0]?.id),[data]);
  const topic=data.find((x)=>x.id===topicId)||data[0];
  return <section>
    <div className="subtabs">{data.map((item,i)=><button key={item.id} className={topic.id===item.id?'active':''} onClick={()=>setTopicId(item.id)}>{i+1}. {item.shortTitle}</button>)}</div>
    <div className="topic-intro"><h2>{topic.title}</h2><p><MarkedText text={topic.intro}/></p></div>
    {topic.roles && <div className="role-grid">{topic.roles.map((r)=><article className={`role role-${r.key}`} key={r.key}><h3>{r.key} ({r.label})</h3><p>{r.question}</p><strong>{r.examples}</strong></article>)}</div>}
    <div className="learn-grid">{topic.cards.map((card)=><article className={`learn-card ${card.tone||''}`} key={card.title}><h3>{card.title}</h3><p><MarkedText text={card.text}/></p>{card.examples?.map((x)=><div className="example" key={x}><MarkedText text={x}/></div>)}</article>)}</div>
    {topic.pattern && <div className="pattern"><strong>Gizli formül</strong><div>{topic.pattern.map((x)=><span className={`chip role-${x}`} key={x}>{x}</span>)}</div></div>}
  </section>;
}

function Reading({ data, onPoints }) {
  const [selected,setSelected]=useState([]); const [checked,setChecked]=useState(false);
  const toggle=(id)=>{if(checked)return;setSelected((v)=>v.includes(id)?v.filter((x)=>x!==id):[...v,id]);};
  const targets=data.tokens.filter((x)=>x.target).map((x)=>x.id);
  const perfect=checked&&targets.every((x)=>selected.includes(x))&&selected.every((x)=>targets.includes(x));
  function check(){setChecked(true);if(targets.every((x)=>selected.includes(x))&&selected.every((x)=>targets.includes(x))){onPoints(25);playTone(740);}else playTone(260,.2);}
  return <section><div className="topic-intro"><h2>{data.title}</h2><p><MarkedText text={data.instructions}/></p></div>
    <article className="reading">{data.tokens.map((token)=><button key={token.id} onClick={()=>toggle(token.id)} className={`${selected.includes(token.id)?'selected':''} ${checked?(token.target?'correct':selected.includes(token.id)?'wrong':''):''}`}>{token.text}</button>)}</article>
    <div className="action-row"><button className="primary" onClick={check}>Kontrol Et</button><button className="secondary" onClick={()=>{setSelected([]);setChecked(false)}}><RotateCcw size={16}/>Temizle</button></div>
    {checked&&<div className={`big-feedback ${perfect?'good':'try'}`}>{perfect?'Harika! Bütün hedef kelimeleri buldun.':'Tekrar incele: yeşiller doğru, kırmızılar hedef değil.'}</div>}
    <div className="reading-questions">{data.questions.map((q)=><MiniQuestion key={q.id} item={q} onPoints={onPoints}/>)}</div>
    {data.extra&&<section className="extra-reading"><div className="topic-intro"><span className="level-pill">A2 · Uzun Okuma</span><h2>{data.extra.title}</h2><p>{data.extra.instructions}</p></div><article className="long-reading">{data.extra.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</article><div className="reading-questions">{data.extra.questions.map((q)=><MiniQuestion key={q.id} item={q} onPoints={onPoints}/>)}</div></section>}
  </section>;
}

function Listening({ data, onPoints }) {
  return <section><div className="topic-intro"><span className="level-pill">{data.level}</span><h2>{data.title}</h2><p>{data.instructions}</p></div><article className="listening-card"><Headphones size={38}/><div><span>{data.source}</span><h3>{data.resource}</h3><p>{data.task}</p></div><a href={data.url} target="_blank" rel="noreferrer">Dinlemeyi aç <ExternalLink size={17}/></a></article><div className="remember-listening"><strong>İki turda çalış</strong><p>{data.followUp}</p></div><div className="reading-questions">{data.questions.map((q)=><MiniQuestion key={q.id} item={q} onPoints={onPoints}/>)}</div></section>;
}

function MiniQuestion({item,onPoints}) { const [choice,setChoice]=useState(null); const correct=choice===item.answer; function pick(x){if(choice!==null)return;setChoice(x);if(x===item.answer){onPoints(10);playTone(650)}else playTone(280,.2)} return <article><h3>{item.prompt}</h3>{item.options.map((x)=><button onClick={()=>pick(x)} className={choice===x?(correct?'right':'wrong'):choice!==null&&x===item.answer?'right':''} key={x}>{x}</button>)}{choice!==null&&<p>{correct?'Doğru!':item.explanation}</p>}</article> }

function SortGame({ items, onPoints }) {
  const [index,setIndex]=useState(0); const [status,setStatus]=useState(null); const item=items[index%items.length];
  function choose(type){if(status)return;if(type===item.type){setStatus('good');onPoints(10);playTone(650);setTimeout(()=>{setIndex((x)=>x+1);setStatus(null)},750)}else{setStatus('bad');playTone(250,.2);setTimeout(()=>setStatus(null),550)}}
  return <section><div className="topic-intro"><h2>Kelime Dedektifi</h2><p>Ortadaki kelime veya grubun cümledeki görevini seç.</p></div><div className={`sort-word ${status||''}`}>{item.text}</div><div className="sort-buttons">{item.choices.map((x)=><button className={`role-${x}`} key={x} onClick={()=>choose(x)}><strong>{x}</strong><span>{roleNames[x]}</span></button>)}</div><p className="counter">{index+1}. tur · Her doğru cevap 10 puan</p></section>;
}

function OrderGame({ sentences, onPoints }) {
  const [index,setIndex]=useState(0); const [bank,setBank]=useState([]); const [answer,setAnswer]=useState([]); const [status,setStatus]=useState(null);
  const sentence=sentences[index%sentences.length];
  useEffect(()=>{setBank(shuffle(sentence.parts.map((text,i)=>({id:`${index}-${i}`,text}))));setAnswer([]);setStatus(null)},[index,sentences]);
  function move(from,setFrom,to,setTo,i){const copy=[...from];const [word]=copy.splice(i,1);setFrom(copy);setTo([...to,word]);setStatus(null)}
  function check(){const attempt=answer.map((x)=>x.text).join(' ');if(attempt===sentence.answer){setStatus('good');onPoints(20);playTone(620);setTimeout(()=>playTone(840),100)}else{setStatus('bad');playTone(260,.2)}}
  return <section><div className="topic-intro"><h2>Cümleyi Kur</h2><p>Taşlara dokun ve doğru İngilizce sırasını oluştur. Noktalama işaretini sistem ekleyecek.</p></div><div className="round-indicator">Cümle {index%sentences.length+1} / {sentences.length}</div><div className={`answer-zone ${status||''}`}>{answer.length?answer.map((x,i)=><button className="word-tile in-answer" key={x.id} onClick={()=>move(answer,setAnswer,bank,setBank,i)}>{x.text}</button>):<span>Cümleni buraya kur…</span>}</div><div className="word-bank">{bank.map((x,i)=><button className="word-tile" key={x.id} onClick={()=>move(bank,setBank,answer,setAnswer,i)}>{x.text}</button>)}</div><div className="action-row"><button className="primary" onClick={check}>Kontrol Et</button><button className="secondary" onClick={()=>setIndex((x)=>x+1)}>Sonraki Cümle <ChevronRight size={17}/></button></div>{status&&<div className={`big-feedback ${status}`}>{status==='good'?'Harika! Doğru sıralama!':`İpucu: ${sentence.hint}`}</div>}</section>;
}

function Quiz({ groups, onPoints }) {
  const names=Object.keys(groups); const [group,setGroup]=useState(null); const [index,setIndex]=useState(0); const [choice,setChoice]=useState(null); const [hits,setHits]=useState(0);
  if(!group)return <section><div className="topic-intro"><h2>Test Merkezi</h2><p>Bir konu seç veya tüm konuların final testine başla.</p></div><div className="quiz-menu">{names.map((name)=><button key={name} onClick={()=>{setGroup(name);setIndex(0);setChoice(null);setHits(0)}}><CircleHelp size={24}/><strong>{name}</strong><span>{groups[name].length} soru</span></button>)}</div></section>;
  const questions=groups[group]; if(index>=questions.length)return <section className="quiz-end"><Trophy size={56}/><h2>Test tamamlandı!</h2><p>{hits} / {questions.length} doğru</p><button className="primary" onClick={()=>setGroup(null)}>Başka Test Seç</button></section>;
  const q=questions[index]; const correct=choice===q.answer;
  function pick(x){if(choice!==null)return;setChoice(x);if(x===q.answer){setHits((h)=>h+1);onPoints(15);playTone(650)}else playTone(260,.2)}
  return <section className="quiz-player"><button className="text-button" onClick={()=>setGroup(null)}>← Test menüsü</button><div className="quiz-progress"><span style={{width:`${index/questions.length*100}%`}} /></div><p>Soru {index+1} / {questions.length}</p><h2>{q.prompt}</h2><div className="quiz-options">{q.options.map((x)=><button onClick={()=>pick(x)} className={choice===x?(correct?'right':'wrong'):choice!==null&&x===q.answer?'right':''} key={x}>{x}</button>)}</div>{choice!==null&&<><div className={`big-feedback ${correct?'good':'try'}`}>{correct?'Doğru!':q.explanation}</div><button className="primary next" onClick={()=>{setIndex((x)=>x+1);setChoice(null)}}>Sonraki <ChevronRight size={17}/></button></>}</section>;
}

function HomeworkPicker({ lessons, activeId, onSelect }) {
  const newestWeek = weekStart(lessons[0].date);
  const current = lessons.filter((lesson) => weekStart(lesson.date) === newestWeek);
  const archived = lessons.filter((lesson) => weekStart(lesson.date) !== newestWeek);
  const archiveWeeks = archived.reduce((groups, lesson) => {
    const key = weekStart(lesson.date);
    (groups[key] ||= []).push(lesson);
    return groups;
  }, {});
  const lessonNumber = (entry) => lessons.length - lessons.findIndex((lesson) => lesson.id === entry.id);
  const lessonButton = (entry, compact = false) => <button key={entry.id} className={`${activeId===entry.id?'active':''} ${compact?'compact':''}`} onClick={()=>onSelect(entry)} aria-pressed={activeId===entry.id}><span className="homework-number">{lessonNumber(entry)}</span><span><small>{entry.date}</small><strong>{entry.title}</strong></span>{activeId===entry.id?<CheckCircle2 size={22}/>:<ChevronRight size={22}/>}</button>;
  return <section className="homework-picker" aria-label="Ödev seçimi">
    <div className="picker-heading"><div><strong>Bu Haftanın Ödevleri</strong><span>{weekLabel(newestWeek)} · Çalışmak istediğin dersi seç</span></div><span>{current.length} ödev</span></div>
    <div className="homework-options">{current.map((entry)=>lessonButton(entry))}</div>
    <div className="archive-area">
      <div className="archive-title"><Archive size={18}/><span><strong>Geçmiş Ödevler</strong><small>Önceki haftalar burada saklanır</small></span><span className="archive-count">{archived.length}</span></div>
      {archived.length ? <div className="archive-weeks">{Object.entries(archiveWeeks).map(([start, entries])=><details key={start} open={entries.some((entry)=>entry.id===activeId)}><summary><span>{weekLabel(start)}</span><small>{entries.length} ödev</small><ChevronDown size={17}/></summary><div className="archive-lessons homework-options">{entries.map((entry)=>lessonButton(entry,true))}</div></details>)}</div> : <p className="empty-archive">İlk geçmiş hafta oluştuğunda burada haftalara ayrılmış olarak görünecek.</p>}
    </div>
  </section>;
}

export default function App(){
  const [index,setIndex]=useState(null),[hw,setHw]=useState(null),[tab,setTab]=useState('learn'),[score,setScore]=useState(0),[burst,setBurst]=useState(0),[error,setError]=useState('');
  useEffect(()=>{fetch(`${import.meta.env.BASE_URL}homeworks/index.json`).then((r)=>r.json()).then(setIndex).catch(()=>setError('Ödev listesi yüklenemedi.'))},[]);
  async function load(entry){try{const r=await fetch(`${import.meta.env.BASE_URL}homeworks/${entry.path}`);const data=await r.json();setHw(data);setTab('learn');setScore(JSON.parse(localStorage.getItem(storageKey(data))||'{}').score||0)}catch{setError('Bu ödev yüklenemedi.')}}
  useEffect(()=>{if(index?.lessons?.length)load(index.lessons[0])},[index]);
  function points(n){setScore((s)=>{const next=s+n;localStorage.setItem(storageKey(hw),JSON.stringify({score:next}));return next});setBurst((x)=>x+1);setTimeout(()=>setBurst(0),1500)}
  if(error)return <main className="state"><AlertTriangle/><h1>{error}</h1></main>;if(!hw)return <main className="state"><LoaderCircle className="spin"/><p>Ödev hazırlanıyor…</p></main>;
  return <div className="page"><Confetti burst={burst}/><header className="game-header"><div className="identity"><span><GraduationCap size={27}/></span><div><h1>İngilizce Dilbilgisi Ustası</h1><p>Sümeyye · A1–A2</p></div></div><div className="score"><span><Star size={14}/> Puan</span><strong>{score}</strong></div></header>
    <HomeworkPicker lessons={index.lessons} activeId={hw.id} onSelect={load}/>
    <nav className="game-nav">{nav.map(([id,label,Icon])=><button className={tab===id?'active':''} key={id} onClick={()=>setTab(id)}><Icon size={18}/><span>{label}</span></button>)}</nav>
    <main className="game-main"><div className="lesson-ribbon"><Sparkles size={18}/><span>{hw.dateLabel}</span><strong>{hw.title}</strong></div>{tab==='learn'&&<Learn data={hw.game.learn}/>} {tab==='read'&&<Reading data={hw.game.read} onPoints={points}/>} {tab==='listen'&&<Listening data={hw.game.listening} onPoints={points}/>} {tab==='sort'&&<SortGame items={hw.game.sort} onPoints={points}/>} {tab==='order'&&<OrderGame sentences={hw.game.order} onPoints={points}/>} {tab==='quiz'&&<Quiz groups={hw.game.quizzes} onPoints={points}/>}</main>
    <footer><Volume2 size={15}/> Doğru cevaplarda ses ve puan kazanırsın. İlerlemen bu tarayıcıda saklanır.</footer></div>;
}
