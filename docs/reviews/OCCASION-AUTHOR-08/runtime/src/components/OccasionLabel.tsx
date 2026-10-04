/** Only captured, already-encountered labels belong in the reader. */
export function OccasionLabel({record}:{record:{occasionLabel?:string}}){
  return record.occasionLabel?<span className="occasion-label">{record.occasionLabel}</span>:null;
}
