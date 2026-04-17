export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface GenerationResult {
  sourcePath: string;
  sourceHash: string;
  questions: GeneratedQuestion[];
}
