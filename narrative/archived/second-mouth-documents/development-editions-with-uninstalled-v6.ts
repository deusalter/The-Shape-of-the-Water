interface DevelopmentStage {
  label: string;
  completion: string;
  returnLabel: string;
}

const stages: Record<number, DevelopmentStage> = {
  4: {
    label: 'First movement',
    completion: 'This completes the first movement in this development edition.',
    returnLabel: 'Return before departure',
  },
  5: {
    label: 'First journeys',
    completion: 'This completes the available chapter in this development edition.',
    returnLabel: 'Return before the chapter ends',
  },
  6: {
    label: 'The first return',
    completion: 'This completes the available chapter in this development edition.',
    returnLabel: 'Return before the chapter ends',
  },
};

export function developmentStageFor(contentId: string, version: number): DevelopmentStage | undefined {
  return contentId === 'shape-of-the-water' ? stages[version] : undefined;
}
