import {Component, OnInit} from '@angular/core';
import {AuthenticationService} from '../../modules/client/services/authentication.service';
import {Utilities as _util} from '@cmi/viaduc-web-core';

@Component({
	selector: 'cmi-viaduc-auth-page',
	templateUrl: 'authPage.component.html'
})
export class AuthPageComponent implements OnInit {

	public success: boolean;

	constructor(private _authentication: AuthenticationService) {
	}

	public ngOnInit(): void {
		this._authentication.isSigningIn = true;

		let token = _util.getQueryParams(window.location.hash)['token'];
		let activate = !_util.isEmpty(token)
			? this._authentication.activateSessionWithToken(token)
			: this._authentication.activateSession();

		activate.then(
			r => {
				this._authentication.isSigningIn = false;
				this._authentication.onSignedIn.next(r);
				this.success = true;
				this.redirectToOriginBeforeLogin();
			},
			e => {
				this.success = false;
				this._authentication.isSigningIn = false;
				this._authentication.onSignedIn.next(false);
				throw e;
			});

	}

	public redirectToOriginBeforeLogin(): void {
		this._authentication.redirectToOriginBeforeLogin();
	}
}
