import { visualAssets, releaseInspection } from '../content/visuals';
import '../styles/encounter-art.css';

/** Only the existing release encounter receives diagnostic art. No engine state is changed. */
export function EncounterArt({ sceneId }: { sceneId: string }) {
  if (sceneId !== 'release') return null;
  return <section className="encounter-art" aria-label="The bath and the empty cabinet test">
    <figure className="encounter-location">
      <img src={visualAssets.bath.src} alt={visualAssets.bath.alt} width={1536} height={1024} decoding="async" />
      <figcaption>At the shallow end</figcaption>
    </figure>
    <div className="encounter-cast" aria-label="At the empty test">
      {[visualAssets.ada, visualAssets.simon].map(person => <figure className="encounter-portrait" key={person.name}>
        <img src={person.src} alt={person.alt} width={1122} height={1402} decoding="async" />
        <figcaption>{person.name}</figcaption>
      </figure>)}
      <p className="encounter-safety">The cabinet remains empty throughout the test.</p>
    </div>
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
