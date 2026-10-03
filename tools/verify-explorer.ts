import { availableChoices, applyChoice, confirmationFor, createGame, stateHash, contentHash, type Content, type GameState, type Command } from '../src/engine/game';

export type SearchMode = 'exact' | 'guard-abstraction';
export interface Budget { states: number; transitions: number; milliseconds: number }
export interface Trace { commands: Command[]; terminalStateHash: string; endingScene: string }
interface Node { state: GameState; parent: number; command?: Command; key: string }
export interface Exploration {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  mode: SearchMode; claim: string; contentHash: string; budget: Budget;
  states: number; transitions: number; expanded: number; frontier: number;
  stopReason: string; elapsedMilliseconds: number;
  scenesReached: string[]; choicesUsed: string[]; terminalTraces: Trace[];
  failures: { message: string; trace: Command[]; stateHash: string }[];
  frontierSample: { stateHash: string; revision: number; scene: string; trace: Command[] }[];
  maximumTerminalDistance?: number;
}

/** This is ONLY a navigation guard abstraction, not full save/UI/state equivalence.
 * Audited current production guards read scene, monotonic flags, ended and content
 * identity. Records are retained conservatively. Revision, transcript and command
 * IDs are NOT omitted from exact mode. Fresh IDs/current confirmation receipts and
 * enough remaining steps are assumptions of this separate abstraction. */
export function guardKey(state: GameState): string {
  const records = (field: 'observations' | 'interpretations' | 'relationships') => state[field].map(({ id, text, sceneId }) => ({ id, text, sceneId })).sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify({ contentId: state.contentId, contentVersion: state.contentVersion, contentHash: state.contentHash, currentScene: state.currentScene, ended: state.ended, flags: [...state.flags].sort(), observations: records('observations'), interpretations: records('interpretations'), relationships: records('relationships') });
}
function traceTo(nodes: Node[], index: number): Command[] {
  const commands: Command[] = [];
  for (let i = index; nodes[i].parent >= 0; i = nodes[i].parent) commands.push(nodes[i].command!);
  return commands.reverse();
}
export function replayTrace(content: Content, commands: Command[]): GameState {
  let state = createGame(content);
  for (const command of commands) {
    const result = applyChoice(content, state, command);
    if (!result.ok || result.duplicate) throw new Error(`Trace failed at ${command.id}: ${result.ok ? 'duplicate' : result.error.code}`);
    state = result.state;
  }
  return state;
}
export function explore(content: Content, mode: SearchMode, requested: Partial<Budget> = {}, cancelled: () => boolean = () => false): Exploration {
  const budget = { states: 25000, transitions: 500000, milliseconds: 60000, ...requested };
  for (const [key, value] of Object.entries(budget)) if (!Number.isSafeInteger(value) || value < 1) throw new Error(`Invalid budget ${key}`);
  const started = performance.now();
  const keyFor = mode === 'exact' ? stateHash : guardKey;
  const initial = createGame(content);
  const nodes: Node[] = [{ state: initial, parent: -1, key: keyFor(initial) }];
  const indexByKey = new Map([[nodes[0].key, 0]]);
  const predecessors: number[][] = [[]];
  const scenes = new Set([initial.currentScene]), choices = new Set<string>();
  const terminalByScene = new Map<string, Trace>();
  const terminalIndices = new Set<number>();
  const failures: Exploration['failures'] = [];
  let expanded = 0, transitions = 0, stopReason = 'complete';
  outer: for (let head = 0; head < nodes.length; head++) {
    const node = nodes[head], state = node.state;
    if (cancelled()) { stopReason = 'cancelled'; break; }
    if (performance.now() - started >= budget.milliseconds) { stopReason = 'time-budget'; break; }
    if (state.ended) {
      terminalIndices.add(head);
      if (!terminalByScene.has(state.currentScene)) {
        const commands = traceTo(nodes, head), replayed = replayTrace(content, commands);
        if (!replayed.ended || stateHash(replayed) !== stateHash(state)) throw new Error('Terminal witness did not replay exactly.');
        terminalByScene.set(state.currentScene, { commands, terminalStateHash: stateHash(replayed), endingScene: state.currentScene });
      }
      expanded++;
      continue;
    }
    const available = availableChoices(content, state);
    if (!available.length) failures.push({ message: 'Concrete nonterminal state has no available choice; this format has no unresolved-question model.', trace: traceTo(nodes, head), stateHash: stateHash(state) });
    for (const choice of available) {
      if (transitions >= budget.transitions) { stopReason = 'transition-budget'; break outer; }
      if (cancelled()) { stopReason = 'cancelled'; break outer; }
      if (performance.now() - started >= budget.milliseconds) { stopReason = 'time-budget'; break outer; }
      const base: Command = { id: `verify.${head}.${transitions}`, choiceId: choice.id, expectedRevision: state.revision };
      const command = choice.ending || choice.irreversible ? { ...base, confirmation: confirmationFor(state, base) } : base;
      const result = applyChoice(content, state, command);
      transitions++;
      if (!result.ok || result.duplicate) { failures.push({ message: `Available choice ${choice.id} failed: ${result.ok ? 'duplicate' : result.error.code}`, trace: [...traceTo(nodes, head), command], stateHash: stateHash(state) }); continue; }
      choices.add(choice.id); scenes.add(result.state.currentScene);
      const key = keyFor(result.state), known = indexByKey.get(key);
      if (known !== undefined) { predecessors[known].push(head); continue; }
      if (nodes.length >= budget.states) { stopReason = 'state-budget'; break outer; }
      const next = nodes.length;
      nodes.push({ state: result.state, parent: head, command, key });
      predecessors.push([head]); indexByKey.set(key, next);
    }
    expanded++;
  }
  let maximumTerminalDistance: number | undefined;
  if (stopReason === 'complete') {
    const distances = new Map([...terminalIndices].map(index => [index, 0]));
    const queue = [...terminalIndices];
    for (let i = 0; i < queue.length; i++) for (const parent of predecessors[queue[i]]) if (!distances.has(parent)) { distances.set(parent, distances.get(queue[i])! + 1); queue.push(parent); }
    maximumTerminalDistance = Math.max(0, ...distances.values());
    for (let i = 0; i < nodes.length; i++) if (!distances.has(i)) failures.push({ message: mode === 'exact' ? 'No terminal path in completely explored concrete component.' : 'No terminal path in completely explored navigation guard abstraction.', trace: traceTo(nodes, i), stateHash: stateHash(nodes[i].state) });
  }
  const outcome = failures.length ? 'FAIL' : stopReason === 'complete' ? 'PASS' : 'INCONCLUSIVE';
  return {
    outcome, mode,
    claim: mode === 'exact' ? 'Full GameState search using fresh commands; every discovered state and terminal witness uses the production engine.' : 'Navigation configurations only: fresh command IDs/current receipts and sufficient remaining command budget. Excludes historical UI/save equivalence and 10,000-command exhaustion.',
    contentHash: contentHash(content), budget, states: nodes.length, transitions, expanded, frontier: nodes.length - expanded,
    stopReason, elapsedMilliseconds: Math.round(performance.now() - started), scenesReached: [...scenes].sort(), choicesUsed: [...choices].sort(), terminalTraces: [...terminalByScene.values()], failures,
    frontierSample: nodes.slice(expanded, expanded + 10).map((node, offset) => ({ stateHash: stateHash(node.state), revision: node.state.revision, scene: node.state.currentScene, trace: traceTo(nodes, expanded + offset) })),
    ...(maximumTerminalDistance === undefined ? {} : { maximumTerminalDistance }),
  };
}
