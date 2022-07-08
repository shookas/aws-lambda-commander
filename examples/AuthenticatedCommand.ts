import { Command } from '@commander/handlers/Command';
import { AuthorisationError } from '@commander/errors/Errors';

export abstract class AuthenticatedCommand<Input, Output, User extends Commander.Core.Identifiable> extends Command<Input, Output> {
    private static AUTH_HEADER = 'Authorization';
    private user: User | null = null;
    protected get User() {
        if (!this.user) {
            throw new AuthorisationError('Invalid Token');
        }
        return this.user;
    }
    get IsAuthenticated(): boolean {
        return this.user !== null;
    }
    constructor(protected readonlyUserRepository: Commander.Repositories.ReadOnlyRepository<User>, private allowBypass = false) {
        super();
    }
    abstract Run(source: Input): Promise<Output>;
    Clean() {
        this.user = null;
        super.Clean();
    }
    /**
    * Authorise Function on the authenticated base command
    *
    }
    @param {string} header The header containing credentials
    * @returns nothing.
    * @memberof Command
    */
    async Authenticate(event: AWSLambda.APIGatewayEvent) {
        const tokenSource: string | null = this.getTokenFromHeader(event);
        if (!tokenSource && this.allowBypass) {
            return
        }
        if (!tokenSource) {
            this.Logger.Security(`Invalid Token ${event.headers[AuthenticatedCommand.AUTH_HEADER]}`);
            throw new AuthorisationError('Invalid Token');
        }
        try {
            this.user = await this.readonlyUserRepository.Get('some id from token')
        } catch (error) {
            this.Logger.Error(error)
            throw new AuthorisationError('Invalid Token')
        }
    }

    private getTokenFromHeader(event: AWSLambda.APIGatewayEvent) {
        const header = event.headers[AuthenticatedCommand.AUTH_HEADER];
        if (!header || !header.match(/^Bearer (.*)$/)) {
            return null;
        }
        return header.substring(7);
    }

    checkRole(roles: string[], action: string) {
        const allowedRoles = ['admin']
        const intersection = roles.filter((element) => allowedRoles.toString().includes(element));
        if (intersection.length == 0) {
            this.Logger.Security(`Apptempt to ${action} by unatthorized user ${this.User.id}`)
            throw new AuthorisationError();
        }
        return;
    }
}
