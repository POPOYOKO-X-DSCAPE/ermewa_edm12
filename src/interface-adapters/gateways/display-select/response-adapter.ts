import type { DisplaySelectBodyResponse } from '@/interface-adapters/external-types';

function adaptDisplaySelectResponse(input: DisplaySelectBodyResponse) {

  return input.xSel;
};

export default adaptDisplaySelectResponse;
