/** Scene art is presentation only. It adds no evidence, flags, claims or beliefs. */
export const visualAssets = {
  binding: { src: `${import.meta.env.BASE_URL}art/release-binding.svg`, alt: 'Reconstruction of the empty test: external cord across the door, a separate ring and latch, an outward door swing stopped by a padded chair before the pier, and impact damage above the old felt pad.' },
} as const;

export const releaseInspection = [
  { title: 'Cord and latch', text: 'The replacement cord passes around the cabinet and across the door. The brass ring pulls a cable to the latch. The latch can withdraw while the external cord still holds the door.' },
  { title: 'Door and chair', text: 'The mirror is mounted on the inside of an outward-opening door. In this empty test, a padded chair stands between the door and the concrete pier. With the cord slackened, the chair stops the door before it reaches the pier.' },
  { title: 'Impact height', text: 'The dent on the mirror frame aligns with the pale chip on the pier above the old felt pad. The pad is too low to protect the part that struck.' },
] as const;
