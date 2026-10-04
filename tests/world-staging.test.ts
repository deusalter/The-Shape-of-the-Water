import {describe,it,expect} from 'vitest';
import {placeForScene,targetsFor} from '../src/world/staging';

describe('world actions follow actual available authored choices',()=>{
  it('retains the full occasion action ID while staging the same first-night encounter',()=>{
    const choice={id:'o0.arrival-ada',label:'Ask Ada to show you the cut cord.'};
    expect(targetsFor([choice],'o0.arrival')).toEqual([{choiceId:choice.id,label:choice.label,shortLabel:'Ada',x:-2.5,z:8.5}]);
    expect(placeForScene('o0.workshop')).toEqual(placeForScene('workshop'));
  });
  it('offers no missing travel action and does not interpret crossing labels as movement triggers',()=>{
    expect(targetsFor([],'arrival')).toEqual([]);
    expect(targetsFor([{id:'o1.second-crossing',label:'Go through the service door.'}],'o1.trial')).toEqual([]);
  });
});
