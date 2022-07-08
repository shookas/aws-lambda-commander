import { Command } from '@commander/handlers/Command';
export class TestCommand extends Command<string, { id: string }> {
    constructor(
        private assetRepository: Commander.Repositories.ReadOnlyRepository<{ id: string }>,
    ) {
        super()
    }
    async Run(source: string): Promise<{ id: string }> {
        return this.assetRepository.Get(source);
    }
}