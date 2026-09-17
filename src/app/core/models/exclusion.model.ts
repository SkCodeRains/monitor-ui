export type ExclusionType = 'title' | 'package';

export interface ExclusionItem {
  id: string;
  type: ExclusionType;
  value: string;
  createdAt: string;
}

export interface ExclusionsResponse {
  success: boolean;
  count: number;
  data: ExclusionItem[];
  titles: string[];
  packages: string[];
}

export interface AddExclusionRequest {
  type: ExclusionType;
  value: string;
}