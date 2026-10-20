export interface Flow {
  next: () => void;
  back: () => void;
  goTo: (step: number) => void;
}
