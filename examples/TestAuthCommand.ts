import { AuthenticatedCommand } from './AuthenticatedCommand';
export class TestAuthCommand extends AuthenticatedCommand<string, { id: string }, { name: string, id: string }> {
    constructor(
        private assetRepository: Commander.Repositories.ReadOnlyRepository<{ id: string }>,
        usersRepository: Commander.Repositories.ReadOnlyRepository<{ name: string, id: string }>
    ) {
        super(usersRepository)
    }
    async Run(source: string): Promise<{ id: string }> {
        return this.assetRepository.Get(source);
    }
}