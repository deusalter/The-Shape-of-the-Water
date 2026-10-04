import { visualAssets, releaseInspection } from '../content/visuals';
import '../styles/encounter-art.css';

/** Only the existing release encounter receives diagnostic art. No engine state is changed. */
export function EncounterArt({ sceneId,contentId }: { sceneId: string;contentId:string }) {
  if (contentId!=='shape-of-the-water'||sceneId !== 'release') return null;
  return <section className="encounter-art" aria-label="The empty cabinet test">
    <details className="encounter-evidence">
      <summary>Inspect the empty test</summary>
      <div className="encounter-inspection">
        <img src={visualAssets.binding.src} alt={visualAssets.binding.alt} width={900} height={630} loading="lazy" />
        <p className="encounter-diagram-note">Reconstruction drawing. The relationships are shown without measured dimensions.</p>
        {releaseInspection.map(detail => <div className="encounter-inspection-detail" key={detail.title}><h3>{detail.title}</h3><p>{detail.text}</p></div>)}
        <p className="encounter-diagram-note">The original cut ends are kept aside. This test uses another length from the same spool. Accounts or the continuous recording supply the request and the actual order.</p>
      </div>
    </details>
  </section>;
}
