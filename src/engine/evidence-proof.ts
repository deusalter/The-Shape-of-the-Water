import type { ProofV2, WitnessV2 } from './evidence-types';
const unique = (refs: string[]) => [...new Set(refs)].sort();
/** Bounded witness expansion preserves nested AND/OR and independence constraints. */
export function compileProofV2(proof: ProofV2): WitnessV2[] {
  const visit = (node: ProofV2): WitnessV2[] => {
    if (node.op === 'ref') return [{ refs: [node.refId], independent: [] }];
    const children = node.args.map(visit);
    if (node.op === 'any') {
      if (node.independent) throw new Error('independent is only valid on all proof nodes');
      const result = children.flat(); if (result.length > 256) throw new Error('Proof exceeds 256 complete witness sets'); return result;
    }
    let combinations: WitnessV2[] = [{ refs: [], independent: [] }];
    for (const child of children) {
      if (combinations.length * child.length > 256) throw new Error('Proof exceeds 256 complete witness sets');
      combinations = combinations.flatMap(left => child.map(right => ({ refs: [...left.refs, ...right.refs], independent: [...left.independent, ...right.independent] })));
    }
    return combinations.map(witness => ({ refs: unique(witness.refs), independent: [...witness.independent, ...(node.independent ? [[...witness.refs]] : [])] }));
  };
  const result = visit(proof), seen = new Set<string>();
  return result.filter(witness => { const key = JSON.stringify(witness); if (seen.has(key)) return false; seen.add(key); return true; }).sort((a,b) => { const left=JSON.stringify(a),right=JSON.stringify(b);return left<right?-1:left>right?1:0; });
}
