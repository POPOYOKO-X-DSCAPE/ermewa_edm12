import type { Repository } from '../types';

type UseCaseContract = Record<string, Function>;

const createAbstractUseCaseBuilder = <R extends Record<string, Repository<any>>>(
  repositories: R
) => {
  function createUseCaseBuilder<S extends any>(
    services: S
  ) {
    type Dependencies = { repositories: R, services: S };

    function createUseCase <T extends UseCaseContract>(callback: (dependencies: Dependencies) => T) {

      return callback({ repositories, services });
    }

    return { createUseCase };
  }

  return createUseCaseBuilder;
}

export default createAbstractUseCaseBuilder;
