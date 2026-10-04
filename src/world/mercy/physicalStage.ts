import type {MercyProfile} from './profiles';
/** All buildEnvironment inputs that affect visible geometry, in construction order.
 * Choice labels, scene identity and historical evidence cannot affect physical staging.
 * Keep one current environment only; this key does not retain disposed geometry.
 */
export function physicalStageKey(profile:MercyProfile){
 return JSON.stringify({location:profile.location,gathered:profile.id.startsWith('a2.')&&['patron','late-square','late-theatre'].includes(profile.location),props:profile.props,actors:profile.actors});
}
