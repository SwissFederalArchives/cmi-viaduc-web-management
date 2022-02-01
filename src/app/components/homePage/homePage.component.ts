import {Component, OnInit} from '@angular/core';
import {ClientContext} from '@cmi/viaduc-web-core';
import {AuthenticationService} from '../../modules/client/services/authentication.service';
import {AuthorizationService, UrlService} from '../../modules/shared/services';

@Component({
	selector: 'cmi-viaduc-home-page',
	templateUrl: 'homePage.component.html',
	styleUrls: ['./homePage.component.less']
})
export class HomePageComponent implements OnInit {

	public crumbs: any[] = [];

	public get authenticated(): boolean {
		return this._context.authenticated;
	}

	public get authorized(): boolean {
		return this.authenticated && this._authorization.authorized();
	}

	private _authenticating = false;
	public get authenticating(): boolean {
		return this._authenticating;
	}

	constructor(private _context: ClientContext,
				private _authentication: AuthenticationService,
				private _authorization: AuthorizationService,
				private _url: UrlService) {
	}

	private _buildCrumbs(): void {
		let crumbs: any[] = this.crumbs = [];
		crumbs.push({iconClasses: 'glyphicon glyphicon-home', url: this._url.getHomeUrl()});
	}

	public ngOnInit(): void {
		this._buildCrumbs();

		if (!this.authenticated) {
			this._authenticating = true;
			if (this._authentication.hasExistingSession()) {
				this._authentication.tryActivateExistingSession().then((success) => {
					this._authentication.isSigningIn = false;
					this._authenticating = false;
					this._authentication.onSignedIn.next(success);
				}).catch(err => {
					console.error(err);
					this._authentication.isSigningIn = false;
					this._authenticating = false;
					this._authentication.onSignedIn.next(false);
				});
			} else {
				this._authenticating = false;
				this._authentication.login();
			}
		}
	}

	public login(): void {
		this._authentication.login();
	}

}
