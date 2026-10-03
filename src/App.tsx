import { useEffect, useRef, useState } from 'react';
import { applyChoice, availableChoices, confirmationFor, createGame, currentPassage, serializePlayerExport, stateHash, validateState, type Command, type Content, type GameState } from './engine/game';
import { contentWarning, initialContent } from './content/load';
import { GameStore } from './persistence/store';
import { useOfflineStatus } from './offline';

const playerStore = new GameStore();
export function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
type PendingAction = { label: string; detail: string; run: () => void };
function ConfirmationDialog({ action, cancel }: { action: PendingAction; cancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close(); }, []);
  return <dialog ref={dialog} aria-labelledby="confirm-title" onCancel={cancel}><h2 id="confirm-title">Confirm this action</h2><p>{action.label}</p><p>{action.detail}</p><div className="toolbar"><button autoFocus className="quiet" onClick={cancel}>Cancel</button><button onClick={() => { cancel(); action.run(); }}>Confirm action</button></div></dialog>;
}
export function App({ suppliedContent = initialContent, persistence = playerStore, preview = false }: { suppliedContent?: Content; persistence?: GameStore; preview?: boolean }) {
  const content = suppliedContent;
  const [game, setGame] = useState(() => createGame(content));
  const [ready, setReady] = useState(false), [notice, setNotice] = useState('Loading saved progress…'), [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [unsavedAcknowledged,setUnsavedAcknowledged] = useState(false), [showNotebook,setShowNotebook] = useState(false), [textSize,setTextSize] = useState('normal');
  const [archives,setArchives] = useState<{id:string;revision:number;ended:boolean}[]>([]), [incompatible,setIncompatible] = useState<{id:string;contentVersion:unknown;contentHash:unknown;json:string}[]>([]);
  const gameRef = useRef(game), commit = useRef(0), blocked = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve()), pending = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const offline = useOfflineStatus(preview,game.contentHash);
  function adopt(next: GameState) { gameRef.current = next; setGame(next); }
  async function loadProgress() {
    setReady(false);setIncompatible([]); await queue.current;
    const loaded = await persistence.load(content);
    if (loaded.kind === 'loaded' || loaded.kind === 'recovered') {
      commit.current = loaded.commit; blocked.current = false; adopt(loaded.state);
      setNotice(loaded.kind === 'recovered' ? 'The newest save was damaged. A verified earlier checkpoint has been recovered; damaged data was retained locally.' : 'Saved progress loaded.');
    } else if (loaded.kind === 'empty' || loaded.kind === 'corrupt') {
      commit.current = loaded.commit; blocked.current = false;
      setNotice(loaded.kind === 'corrupt' ? loaded.message : 'No saved run for this exact content revision. Progress saves in this browser after each choice; exported runs can be reimported.');
    } else if (loaded.kind === 'incompatible') { commit.current=0;blocked.current=false;setIncompatible(loaded.retained);setNotice(loaded.message); }
    else if (loaded.kind === 'error') { blocked.current = true;setUnsavedAcknowledged(false); setNotice(loaded.message); }
    void persistence.listArchives(content).then(setArchives).catch(()=>undefined);
    setReady(true);
  }
  useEffect(() => { void loadProgress(); }, []);
  useEffect(() => { if (game.revision > 0) heading.current?.focus(); }, [game.currentScene, game.revision]);
  function saveProgress(next: GameState,archiveCurrent=false) {
    if (blocked.current) return;
    pending.current += 1; setSaving(true);
    queue.current = queue.current.then(async () => {
      if (blocked.current) return;
      const saved = await persistence.save(content, next, commit.current,{archiveCurrent});
      if (saved.ok) { commit.current = saved.commit;setUnsavedAcknowledged(false); setNotice('Progress saved in this browser.');void persistence.listArchives(content).then(setArchives).catch(()=>undefined); }
      else { blocked.current = true;setUnsavedAcknowledged(false); setNotice(saved.message); }
    }).catch(() => { blocked.current = true;setUnsavedAcknowledged(false); setNotice('Saving failed. Your active run remains in memory; export it before closing.'); }).finally(() => { pending.current -= 1; setSaving(pending.current > 0); });
  }
  function dispatch(command: Command) {
    const result = applyChoice(content, gameRef.current, command);
    if (!result.ok) { setNotice(result.error.message); return; }
    adopt(result.state); saveProgress(result.state);
  }
  function choose(choiceId: string) {
    const state = gameRef.current, choice = availableChoices(content, state).find(choice => choice.id === choiceId);
    if (!choice) return;
    const command: Command = { id: crypto.randomUUID(), choiceId, expectedRevision: state.revision };
    if (choice.ending || choice.irreversible) {
      const confirmed = { ...command, confirmation: confirmationFor(state, command) };
      setPendingAction({ label: choice.label, detail: choice.ending ? 'This action closes the run. Your transcript will remain available.' : 'This interpersonal action cannot be undone within this run.', run: () => dispatch(confirmed) });
    } else dispatch(command);
  }
  async function restart() { setReady(false); await queue.current; const next = createGame(content); adopt(next); setReady(true); saveProgress(next,true); }
  async function importRun(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setNotice('This run file exceeds the 10 MB import limit.'); return; }
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.schemaVersion !== 1 || parsed.engineVersion !== 1 || parsed.kind !== 'encountered-run' || parsed.stateChecksum !== stateHash(parsed.state)) { setNotice('Run import rejected: unsupported envelope or checksum mismatch.'); return; }
      const checked = validateState(content, parsed.state);
      if (!checked.ok) { setNotice(`Run import rejected. ${checked.errors.join(' ')}`); return; }
      const next = checked.value;
      setPendingAction({ label: `Import ${next.contentId}, version ${next.contentVersion}, ${next.revision} actions.`, detail: `The encountered passage is “${currentPassage(next).title}”. Confirming makes this the active run; the prior committed run is archived after a successful save. Export unsaved progress first if you want to keep it.`, run: () => { void queue.current.then(() => { adopt(next); saveProgress(next,true); }); } });
    } catch { setNotice('Run import rejected. Select a valid JSON export for this exact content revision.'); }
  }
  const passage = currentPassage(game), choices = availableChoices(content, game);
  return <div className={`reader reader-${textSize}`}>
    <a className="skip-link" href="#reading">Skip to the passage</a>
    <header className="site-header"><div><p className="eyebrow">{preview ? 'Studio preview · separate local saves' : 'A provisional literary investigation'}</p><h1>{content.title}</h1></div><div className="reader-controls"><label>Text size<select value={textSize} onChange={e=>setTextSize(e.target.value)}><option value="small">Small</option><option value="normal">Standard</option><option value="large">Large</option></select></label><button className="quiet" aria-expanded={showNotebook} onClick={()=>setShowNotebook(!showNotebook)}>{showNotebook?'Close notebook':'Open notebook'}</button></div></header>
    <main id="reading" className={`game-layout ${showNotebook?'':'notebook-closed'}`}><article className="passage-card" aria-labelledby="passage-title">
      {contentWarning && content === initialContent && <p className="warning">{contentWarning}</p>}<p className="eyebrow">{game.ended ? 'Closing passage' : `Passage ${game.revision + 1}`}</p><h2 id="passage-title" ref={heading} tabIndex={-1}>{passage.title}</h2><div className="prose">{passage.paragraphs.map((text, i) => <p key={i}>{text}</p>)}</div>
      <div className="choices" aria-label="Available actions">{choices.map(choice => <button key={choice.id} onClick={() => choose(choice.id)} disabled={!ready||(blocked.current&&!unsavedAcknowledged)}>{choice.label}<span aria-hidden="true">↗</span></button>)}</div>
      {game.ended && <p className="ending-note">This run has ended. Your encountered passages and notes remain available below.</p>}
      {!game.ended && ready && choices.length === 0 && <p className="warning">No actions are available here. Export your run before starting again.</p>}
    </article>{showNotebook&&<aside className="notebook" aria-label="Encountered notes"><p className="eyebrow">Your notebook</p>{(['observations', 'interpretations', 'relationships'] as const).map(field => <section key={field}><h3>{field === 'relationships' ? 'Interpersonal decisions' : field[0].toUpperCase() + field.slice(1)}</h3>{game[field].length ? <ul>{game[field].map(record => <li key={record.id}>{record.text}</li>)}</ul> : <p className="empty-note">Nothing recorded yet.</p>}</section>)}</aside>}
    <section className="run-tools" aria-label="Run and transcript"><div className="save-status" role="status" aria-live="polite">{saving ? 'Saving progress…' : notice}</div>{blocked.current&&<div className="warning"><p>Progress is unsaved. The active run remains exportable.</p>{!unsavedAcknowledged?<button onClick={()=>setUnsavedAcknowledged(true)}>I understand. Continue without saving.</button>:<p>Continuing without saving. Export before closing this page.</p>}</div>}<p className="offline-status" role="status">{offline}</p><div className="toolbar"><button className="quiet" disabled={!ready || saving} onClick={() => void loadProgress()}>Load saved progress</button><button className="quiet" disabled={!ready || saving} onClick={() => { blocked.current = false; saveProgress(gameRef.current); }}>Retry saving</button><button className="quiet" onClick={() => download(`${content.id}-encountered-run.json`, serializePlayerExport(gameRef.current))}>Export encountered run</button><details className="restart"><summary>Start or import a run</summary><p>A successful save archives the prior committed run before starting again or importing. Export unsaved progress first.</p><button disabled={!ready || saving} onClick={() => setPendingAction({ label: 'Start a new run.', detail: 'The prior committed run will be archived after a successful save. Export any unsaved transcript first.', run: () => { void restart(); } })}>Start a new run</button><label className="file-label">Import encountered run<input disabled={!ready || saving} type="file" accept=".json,application/json" onChange={e => { void importRun(e.target.files?.[0]); e.target.value = ''; }} /></label></details></div>
    {incompatible.length>0&&<details><summary>Export retained incompatible progress</summary><p>These runs belong to other exact text revisions. They are retained without migration.</p>{incompatible.map((item,index)=><button key={index} onClick={()=>download(`${item.id}-retained-run.json`,item.json)}>Export retained run, version {String(item.contentVersion)}</button>)}</details>}
    <details className="transcript"><summary>Archived runs ({archives.length})</summary>{archives.length?<ul>{archives.map(item=><li key={item.id}>{item.ended?'Completed run':'Earlier run'}, {item.revision} actions <button className="quiet" disabled={!ready||saving} onClick={()=>{void persistence.loadArchive(content,item.id).then(state=>{if(!state){setNotice('Archived run failed validation.');return;}setPendingAction({label:`Load archived run with ${state.revision} actions.`,detail:'This creates a new active branch. The current committed run will be archived after a successful save.',run:()=>{adopt(state);saveProgress(state,true);}});});}}>Load as a branch</button></li>)}</ul>:<p>No archived runs yet.</p>}</details>
    <details className="transcript"><summary>Help, content note and credits</summary><p>Use the action buttons to choose what you do. Tab moves between controls; Enter or Space activates a focused button. The notebook separates encountered observations, selected interpretations and interpersonal decisions. Returning to a scene can add a later passage while the earlier transcript stays intact.</p><p>Progress is local to this browser. Browser data can be cleared or evicted; export a run to keep an independent copy. No automatic save migration is available.</p><p>Content note: includes temporary confinement, a hand injury, and discussion of a parent’s death.</p><p>Original provisional project. Player software uses React, TypeScript and Vite. Authoring materials are provided in a separate studio.</p></details>
    <details className="transcript"><summary>Read encountered transcript ({game.transcript.filter(entry => entry.kind === 'passage').length} passages)</summary><div>{game.transcript.map((entry, i) => entry.kind === 'passage' ? <section key={i}><h3>{entry.title}</h3>{entry.paragraphs.map((p, j) => <p key={j}>{p}</p>)}</section> : <p className="chosen-action" key={i}>You chose: {entry.label}</p>)}</div></details></section></main>
    <footer>Provisional work · Runs stay in this browser · No live AI or network service is needed to play after offline preparation</footer>
    {pendingAction && <ConfirmationDialog action={pendingAction} cancel={() => setPendingAction(null)} />}
  </div>;
}
