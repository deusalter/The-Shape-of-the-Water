#!/usr/bin/env python3
"""Check this specification package, not the game or a real cross-chat resume.

Requires Python 3.11+; uses no third-party packages. Run from any directory.
The seeded execution state is deliberately unstarted. A live project needs its
own state and runtime tests; do not reuse seed checks as runtime certification.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path
import re
import sys
import tomllib
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_TASKS = {f'T{i:02d}' for i in range(30)}


class PacketError(ValueError):
    """An invalid or internally inconsistent planning packet."""


def require(condition: bool, message: str) -> None:
    if not condition:
        raise PacketError(message)


def validate_graph(tasks: list[dict[str, Any]]) -> list[str]:
    require(isinstance(tasks, list) and bool(tasks), 'Missing task graph')
    for task in tasks:
        require(isinstance(task.get('id'), str), 'Invalid task ID')
        deps = task.get('dependsOn')
        require(isinstance(deps, list), 'Dependencies must be a list')
        require(all(isinstance(d, str) for d in deps), 'Invalid dependency ID')
        require(len(deps) == len(set(deps)), 'Duplicate dependency')
    ids = [task['id'] for task in tasks]
    require(len(ids) == len(set(ids)), 'Duplicate task ID')
    known = set(ids)
    graph = {task['id']: set(task['dependsOn']) for task in tasks}
    for task, deps in graph.items():
        require(deps <= known, f'Unknown dependency in {task}')
        require(task not in deps, f'Self dependency in {task}')
    completed: set[str] = set()
    order: list[str] = []
    while len(completed) < len(graph):
        ready = sorted(t for t, deps in graph.items()
                       if t not in completed and deps <= completed)
        require(bool(ready), 'Dependency cycle')
        completed.update(ready)
        order.extend(ready)
    return order


def validate_seed(state: dict[str, Any]) -> None:
    """Validate this packet's truthful unstarted seed, not a running game."""
    require(state.get('packet_revision') == 3, 'Wrong packet revision in seed')
    require(state.get('status') == 'specification_only', 'Seed claims execution')
    require(state.get('completed_tasks') == [], 'Seed claims completed game tasks')
    require(state.get('active_workers') == [], 'Seed claims active workers')
    require(state.get('current_task') == 'T00', 'Seed must start at workspace audit')
    require(state.get('project_revision') is None, 'Seed invents project revision')
    require(state.get('game_content_revision') is None, 'Seed invents story revision')
    require(state.get('last_game_test') is None, 'Seed claims a game test')
    require(state.get('verified_cutoff') is None, 'Seed invents exact cutoff')
    require(state.get('allowance_remaining') == 'unknown', 'Seed invents allowance')
    require(state.get('unknown_external_workers') == 'not_inspected',
            'Seed assumes external worker status')
    require(state.get('packet_check_report') == 'reviews/packet-check.json',
            'Packet-check reference mismatch')
    require(isinstance(state.get('next_action'), str) and bool(state['next_action']),
            'Seed lacks next action')


def negative_checks(tasks: list[dict[str, Any]], seed: dict[str, Any]) -> list[str]:
    mutations: list[tuple[str, Any, Any]] = []
    x = copy.deepcopy(tasks); x[0]['dependsOn'] = ['T99']
    mutations.append(('unknown dependency rejected', validate_graph, x))
    x = copy.deepcopy(tasks); x[0]['dependsOn'] = ['T21']
    mutations.append(('dependency cycle rejected', validate_graph, x))
    x = copy.deepcopy(tasks); x.append(copy.deepcopy(x[0]))
    mutations.append(('duplicate task rejected', validate_graph, x))
    x = copy.deepcopy(tasks); x[0]['dependsOn'] = ['T00']
    mutations.append(('self dependency rejected', validate_graph, x))
    for name, field, value in (
        ('false seed completion rejected', 'completed_tasks', ['T00']),
        ('invented seed game test rejected', 'last_game_test', {'status': 'PASS'}),
        ('invented exact cutoff rejected', 'verified_cutoff', '2026-10-04T00:00:00-07:00'),
        ('missing seed next action rejected', 'next_action', ''),
    ):
        x = copy.deepcopy(seed); x[field] = value
        mutations.append((name, validate_seed, x))
    passed = []
    for name, validator, mutant in mutations:
        try:
            validator(mutant)
        except PacketError:
            passed.append(name)
        else:
            raise PacketError(f'Mutation missed: {name}')
    return passed


def main() -> int:
    try:
        docs = sorted((ROOT / 'docs').glob('[0-9][0-9]-*.md'))
        require(len(docs) == 13, 'Expected 13 governing/review/source documents')
        require({p.name[:2] for p in docs} == {f'{n:02d}' for n in range(13)},
                'Document inventory mismatch')
        required_files = (
            'README.md', 'AGENTS.md', 'CODEX_START_PROMPT.md', 'CONTINUE_PROMPT.md',
            'RESUME.md', 'prompts/PHILOSOPHY_AND_VOICE_UPDATE.md',
            'examples/OPENING-AUDITION.md', 'examples/VOICE-AUDITIONS.md',
            'docs/execution/STATE.json', 'docs/execution/HANDOFF.md',
            'docs/execution/DECISIONS.md', 'docs/execution/CRITIQUE-QUEUE.md',
            'docs/execution/REVISION-HISTORY.md', 'docs/execution/BOARD.md',
            'tools/seed-execution-state.json',
        )
        for name in required_files:
            require((ROOT / name).is_file(), f'Missing file {name}')
        for path in ROOT.rglob('*.md'):
            require('\u2014' not in path.read_text(encoding='utf-8'),
                    f'Unexpected em dash in {path.relative_to(ROOT)}')
        plan = (ROOT / 'docs/04-IMPLEMENTATION-PLAN.md').read_text(encoding='utf-8')
        headings = re.findall(r'^### (T\d{2}):', plan, re.M)
        require(set(headings) == EXPECTED_TASKS and len(headings) == 30,
                'Task heading inventory mismatch')
        model = json.loads((ROOT / 'tools/task-dependencies.json').read_text())
        tasks = model['tasks']
        require({t['id'] for t in tasks} == EXPECTED_TASKS, 'Dependency inventory mismatch')
        order = validate_graph(tasks)
        graph = {t['id']: set(t['dependsOn']) for t in tasks}
        for match in re.finditer(r'^### (T\d{2}):[^\n]*\n(.*?)(?=^### T\d{2}:|\Z)',
                                 plan, re.M | re.S):
            task_id, body = match.groups()
            dependency_line = re.search(r'Dependencies: (.*?)\. Scope:', body)
            require(dependency_line is not None, f'Missing dependency declaration: {task_id}')
            declared = set(re.findall(r'\bT\d{2}\b', dependency_line.group(1)))
            require(declared == graph[task_id], f'Text/JSON dependency mismatch: {task_id}')
        for child, parents in {
            'T09': {'T25', 'T26'}, 'T11': {'T27'},
            'T15': {'T28'}, 'T20': {'T29'},
        }.items():
            require(parents <= graph[child], f'Missing revision-3 dependency gate: {child}')
        # The live STATE may change after T00. Only the immutable seed template
        # is required to be unstarted; never reset real progress to pass this check.
        seed = json.loads((ROOT / 'tools/seed-execution-state.json').read_text())
        validate_seed(seed)
        live_state = json.loads((ROOT / 'docs/execution/STATE.json').read_text())
        require(isinstance(live_state, dict), 'Working STATE must be a JSON object')
        negative = negative_checks(tasks, seed)
        configs = []
        names: set[str] = set()
        allowed = {'gpt-6-astra': {'max', 'xhigh'}, 'gpt-6.1-sol': {'high', 'xhigh'}}
        for path in sorted((ROOT / 'codex-templates/agents').glob('*.toml')):
            data = tomllib.loads(path.read_text(encoding='utf-8'))
            require(all(k in data for k in ('name', 'description', 'developer_instructions',
                                           'model', 'model_reasoning_effort')),
                    f'Missing fields in {path.name}')
            require(data['name'] not in names, 'Duplicate agent name')
            names.add(data['name'])
            require(data['name'] == path.stem, 'Agent filename/name mismatch')
            require(data['model'] in allowed, 'Unexpected model')
            require(data['model_reasoning_effort'] in allowed[data['model']],
                    'Unexpected model/effort pair')
            configs.append({'role': data['name'], 'model': data['model'],
                            'effort': data['model_reasoning_effort']})
        require(len(configs) == 16, 'Expected 16 inert role templates')
        config = tomllib.loads((ROOT / 'codex-templates/config.toml').read_text())
        require(config['agents']['max_concurrent_threads_per_session'] == 4,
                'Concurrency cap mismatch')
        require(config['agents']['default_subagent_model'] == 'gpt-6.1-sol',
                'Default subagent mismatch')
        acceptance = (ROOT / 'docs/05-ACCEPTANCE-TESTS.md').read_text(encoding='utf-8')
        test_ids = set(re.findall(r'\bAC-[LGESAXPVC]\d{2}\b', acceptance))
        require(len(test_ids) == 88, f'Acceptance inventory mismatch: {len(test_ids)}')
        for prefix in ('P', 'V', 'C'):
            require({f'AC-{prefix}{i:02d}' for i in range(1, 9)} <= test_ids,
                    f'Missing revision-3 acceptance IDs: {prefix}')
        source_text = (ROOT / 'docs/08-SOURCES.md').read_text(encoding='utf-8')
        definitions = re.findall(r'^## (S\d{2}):', source_text, re.M)
        require(len(definitions) == len(set(definitions)), 'Duplicate source definition')
        defined = set(definitions)
        require(defined == {f'S{i:02d}' for i in range(1, 32)}, 'Source inventory mismatch')
        used: set[str] = set()
        for path in ROOT.rglob('*.md'):
            if path.name != '08-SOURCES.md':
                used.update(re.findall(r'\bS\d{2}\b', path.read_text(encoding='utf-8')))
        require(used <= defined, f'Undefined source IDs: {used - defined}')
        technical = (ROOT / 'docs/03-TECHNICAL-SPEC.md').read_text(encoding='utf-8')
        for stale in ('ada.second-place', 'mara-was-resident', 'slot-nine',
                      'E01 after D05', 'collection-carbon'):
            require(stale not in technical, f'Retired case residue: {stale}')
        report = {
            'status': 'PASS', 'packetRevision': 3,
            'scope': 'Static specification checks only; not a game, literary-quality, or live resume test',
            'documents': len(docs), 'requiredSupportingFiles': len(required_files),
            'taskCount': len(headings), 'topologicalOrder': order,
            'textAndJsonDependenciesMatch': True,
            'negativeChecks': negative,
            'seedTemplate': 'tools/seed-execution-state.json validated as unstarted; live state is not required to match',
            'acceptanceDefinitions': sorted(test_ids),
            'acceptanceDefinitionCount': len(test_ids),
            'agentTemplates': configs, 'templateCount': len(configs),
            'concurrentSubagentCap': 4, 'sourceDefinitions': len(defined),
            'notTested': [
                'completed philosophical dossiers or final name provenance',
                'replacement story solvability or literary quality', 'game engine',
                'browser UI', 'save behavior', 'human literary response',
                'actual Codex model selection', 'hosted configuration loading',
                'real cross-chat continuation or active-worker recovery',
            ],
        }
        out = ROOT / 'reviews/packet-check.json'
        out.parent.mkdir(exist_ok=True)
        out.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        print(f'PASS: {len(docs)} documents; {len(headings)} acyclic task cards with matching textual dependencies.')
        print(f'PASS: {len(test_ids)} acceptance definitions, {len(defined)} defined sources, truthful unstarted seed.')
        print(f'PASS: {len(configs)} role TOMLs and defaults parse; {len(negative)} negative checks rejected bad input.')
        print('NOT TESTED: game, full research, literary quality, actual model runtime, or real cross-chat recovery.')
        print(out)
        return 0
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
