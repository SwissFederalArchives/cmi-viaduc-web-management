import {Injectable, Injector} from '@angular/core';
import {Router} from '@angular/router';
import {Observable, BehaviorSubject} from 'rxjs';
import {ContextService} from './context.service';
import {
	ConfigService,
	CoreOptions,
	HttpService,
	PreloadService,
	Session,
	Utilities as _util
} from '@cmi/viaduc-web-core';

import {SessionStorageService} from './sessionStorage.service';
import {UserService} from '../../shared/services/user.service';
import {AuthorizationService, UrlService} from '../../shared/services';
import {take} from 'rxjs/operators';
import {AuthStatus} from '../model';

const currentSessionKey = 'viaduc_management_auth_session';
const authReturnUrlKey = 'viaduc_management_auth_return_url';

@Injectable()
export class AuthenticationService {
	public isSigningIn = false;
	public onSignedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	constructor(private _options: CoreOptions,
				private _config: ConfigService,
				private _http: HttpService,
				private _contextService: ContextService,
				private _authorizationService: AuthorizationService,
				private _sessionStorage: SessionStorageService,
				private _preloadService: PreloadService,
				private _userService: UserService,
				private _injector: Injector,
				private _urlService: UrlService) {
	}

	public login(): void {
		const callbackUrl = _util.addToString(window.location.pathname, '/', '#/auth/success?login'); // relative url
		let returnUrl = window.location.hash.replace('#', '');

		let loginUrl = _util.addToString(this._options.serverUrl + this._options.publicPort, '/', 'AuthServices/SignIn?ReturnUrl=' + encodeURIComponent(callbackUrl));
		this._sessionStorage.setUrl(authReturnUrlKey, returnUrl);
		window.location.assign(loginUrl);
	}

	public logout(): void {
		this.clearCurrentSession();
		const baseUrl = window.location.pathname;
		const logoutUrl = _util.addToString(baseUrl, '/', (baseUrl.indexOf('private') < 0 ? 'private/' : '') + '?logout'); // relative url
		window.location.assign(logoutUrl);
	}

	public clearRedirectUrl(): void {
		this._sessionStorage.setItem(authReturnUrlKey, '');
	}

	public async redirectToOriginBeforeLogin(): Promise<void> {
		const returnUrl = this._sessionStorage.getUrl(authReturnUrlKey);

		this.clearRedirectUrl();
		if (returnUrl !== '') {
			const router = this._injector.get(Router);
			await router.navigate([returnUrl]);
		}
	}

	public setCurrentSession(session: Session): void {
		this._sessionStorage.setItem(currentSessionKey, session);
		this._contextService.updateSession(session);
	}

	public clearCurrentSession(): void {
		this._config.removeSetting('user.settings');
		this.setCurrentSession(<Session>{});
	}

	private _initSession(token: string, identity?: any): void {
		const session = <Session>{
			token: token,
			inited: new Date().getTime()
		};

		this._authorizationService.setupSessionAuthorization(session, identity);

		let claims;
		if (_util.isObject(identity) && _util.isArray(identity.issuedClaims)) {
			claims = identity.issuedClaims;
		}

		if (_util.isArray(claims)) {
			session.authenticated = true;
			let matches = claims.filter(c => c.type.indexOf('/identity/claims/e-id/userExtId') >= 0);
			if (!_util.isEmpty(matches)) {
				session.userid = matches[0].value;
			}
			matches = claims.filter(c => c.type.indexOf('/identity/claims/displayName') >= 0);
			if (!_util.isEmpty(matches)) {
				session.username = matches[0].value;
			}
			matches = claims.filter(c => c.type.indexOf('/identity/claims/surname') >= 0);
			if (!_util.isEmpty(matches)) {
				session.lastname = matches[0].value;
			}
			matches = claims.filter(c => c.type.indexOf('/identity/claims/givenname') >= 0);
			if (!_util.isEmpty(matches)) {
				session.firstname = matches[0].value;
			}
			matches = claims.filter(c => c.type.indexOf('/identity/claims/emailaddress') >= 0);
			if (!_util.isEmpty(matches)) {
				session.emailaddress = matches[0].value;
			}
			matches = claims.filter(c => c.type.indexOf('/identity/claims/e-id/userExtId') >= 0);
			if (!_util.isEmpty(matches)) {
				session.userExtId = matches[0].value;
			}

			matches = claims.filter(c => c.type.indexOf('/identity/claims/authenticationmethod') >= 0);
			if (!_util.isEmpty(matches)) {
				session.isKerberosAuthentication = matches[0].value.toLowerCase().indexOf('kerberos') >= 0;
			}
		}

		this.setCurrentSession(session);

		if (!_util.isEmpty(identity)) {
			if (!this._userService.hasUserSettingsLoaded && !this._userService.isLoadingUserSettings) {
				if (!this._preloadService.isPreloaded) {
					this._preloadService.settingsloaded.pipe(take(1)).subscribe(() => {
						this._userService.initUserSettings();
					});
				} else {
					this._userService.initUserSettings();
				}
			}
		}
	}

	private _getIdentity(): Observable<any> {
		const baseUrl = this._options.serverUrl + this._options.publicPort;
		let claimsUrl = baseUrl + '/api/Auth/GetIdentity';
		return this._http.get<any>(claimsUrl);
	}

	public activateSession(): Promise<any> {
		const baseUrl = this._options.serverUrl + this._options.publicPort;
		const tokenUrl = baseUrl + '/token';
		const oAuthParameters = 'grant_type=client_credentials';

		return this._http.post<any>(tokenUrl, oAuthParameters).toPromise().then(
			response => {
				let token = response.access_token;
				this._initSession(token);
				if (token !== '') {
					return this._getIdentity().toPromise().then(
						r => {
							return this.handleIdentityResponse(r, token);
						},
						err => {
							this.clearCurrentSession();
							console.error(err);
							throw err;
						}
					);
				} else {
					return false;
				}
			},
			error => {
				console.error(error);
				throw error;
			}
		);
	}

	public async activateSessionWithToken(token: string): Promise<any> {
		this._initSession(token);
		if (token !== '') {
			return this._getIdentity().toPromise().then(response_identity => {
				return this.handleIdentityResponse(response_identity, token);
			});
		} else {
			return false;
		}
	}

	private _getSessionFromStorage(): Session {
		return this._sessionStorage.getItem<Session>(currentSessionKey);
	}

	public hasExistingSession(): boolean {
		let session = this._getSessionFromStorage();
		return _util.isDefined(session) && _util.isDefined(session.token);
	}

	public async tryActivateExistingSession(): Promise<any> {
		let session = this._getSessionFromStorage();
		if (session != null && session.authenticated) {
			let token = session.token;
			this._initSession(session.token);

			return this._getIdentity().toPromise().then(response_claims => {
				return this.handleIdentityResponse(response_claims, token);
			}, err => {
				console.log(err);
				this.clearCurrentSession();
				throw err;
			});
		}
	}

	private handleIdentityResponse(response: any, token: any) {
		const router = this._injector.get(Router);
		switch (response.authStatus) {
			case AuthStatus.ok:
				this._initSession(token, response);
				return true;
			case AuthStatus.keineKerberosAuthentication:
				router.navigate([this._urlService.getErrorSmartcardUrl()]);
				return true;
			case AuthStatus.neuerBenutzer:
				this._sessionStorage.setItem('pcurl', response.redirectUrl);
				router.navigate([this._urlService.getErrorNewUser()]);
				return true;
			default:
				console.log('Keine definierter AuthStatus!');
				break;
		}
	}

}
