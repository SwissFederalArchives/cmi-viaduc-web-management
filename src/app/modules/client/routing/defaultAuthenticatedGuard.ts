import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate} from '@angular/router';
import {ClientContext} from '@cmi/viaduc-web-core';
import {AuthenticationService} from '../services';

@Injectable()
export class DefaultAuthenticatedGuard implements CanActivate {
	constructor(private _context: ClientContext,
				private _authentication: AuthenticationService) {
	}

	public canActivate(route: ActivatedRouteSnapshot): boolean {
		if (!this._context || this._context.authenticated !== true) {
			this._authentication.login();
			return false;
		}

		return true;
	}

}
