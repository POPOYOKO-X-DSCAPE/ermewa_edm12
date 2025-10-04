import type { DisplaySelectBodyResponse } from '@/interface-adapters/external-types';
import type { DisplaySelectParameter } from '@/interface-adapters/external-types/app-profile';

export type DisplaySelectParameterInterface = {
  parameter: string;
  type: string;
  value: DisplaySelectParameter;
}

export type DisplaySelectInterface = DisplaySelectBodyResponse['xSel'];