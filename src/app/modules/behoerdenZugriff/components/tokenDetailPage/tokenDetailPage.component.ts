import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslationService, Utilities as _util} from '@cmi/viaduc-web-core';
import {UrlService, UiService} from '../../../shared/services';
import {TokenService} from '../../services';
import {AblieferndeStelleToken} from '../../../shared/model/ablieferndeStelleToken';
import {AsToken} from '../../model/asToken';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
	selector: 'cmi-viaduc-token-page-edit',
	templateUrl: 'tokenDetailPage.component.html'
})

export class TokenDetailPageComponent implements OnInit {
	public crumbs: any[] = [];
	public tokenHeaderName: string;
	public id: any;
	public errors: string[];
	public ablieferndeStelleToken: AblieferndeStelleToken;
	public loading: boolean;

	private _allTokens: string[];
	private _mode: Mode;

	constructor(private tokenService: TokenService, private _txt: TranslationService, private _url: UrlService, private _ui: UiService, private _route: ActivatedRoute, private _router: Router) {
	}

	public ngOnInit(): void {
		this._route.params.subscribe(params => this._checkAndProcessId(params['id']));

		this.tokenService.getAllTokens().subscribe(
			res => this._prepareAllTokenList( res != null && res.tokens != null ? res.tokens.map(t => t.token.toLocaleLowerCase()) : null),
			err => this._ui.showError(err));

		this._buildCrumbs();
	}

	private _prepareAllTokenList(result: string[]): void {
		if (!result) {
			return;
		}

		this._allTokens = result;
		if (this.ablieferndeStelleToken && this.ablieferndeStelleToken.token && this._allTokens.filter(t => t === this.ablieferndeStelleToken.token.toLocaleLowerCase())) {
			let index = this._allTokens.indexOf(this.ablieferndeStelleToken.token.toLocaleLowerCase());
			if (index > -1) {
				this._allTokens.splice(index, 1);
			}
		}

	}

	public processChanges(): void {
		if (!this._validateData()) {
			this._clearAndAddError(this._txt.get('behoerdenZugriff.detail.fieldsRequireValues', 'Es wurden nicht alle Pflichtfelder ausgefüllt'));
			return;
		}

		if (this._allTokens.indexOf(this.ablieferndeStelleToken.token.toLocaleLowerCase()) > -1) {
			this._clearAndAddError(this._txt.get('behoerdenZugriff.detail.tokenexists', 'Das von Ihnen angeben Token existiert bereits'));
			return;
		}

		if (this._mode === Mode.Add) {
			let promise: Promise<any> = this.tokenService.createToken(this.ablieferndeStelleToken);
			promise.then((data) => {
					this.goToTokenList();
				},
				(error: HttpErrorResponse) => {
					if (error.error instanceof Error) {
						this._clearAndAddError(error.error.message);
					} else {
						this._clearAndAddError(error.message);
					}
				});
		} else if (this._mode === Mode.Edit) {
			let promise: Promise<any> = this.tokenService.updateToken(this.ablieferndeStelleToken);
			promise.then((data) => {
					this.goToTokenList();
				},
				(error: HttpErrorResponse) => {
					if (error.error instanceof Error) {
						this._clearAndAddError(error.error.message);
					} else {
						this._clearAndAddError(error.message);
					}
				});
		}
	}

	public get hasErrors(): boolean {
		return this.errors && this.errors.length > 0;
	}

	public goToTokenList(): void {
		this._router.navigate([this._url.getNormalizedUrl('/behoerdenzugriff/token')]);
	}

	private _clearAndAddError(error: string): void {
		this.errors = [];
		this.errors.push(error);
	}

	private _validateData(): boolean {
		if (!this.ablieferndeStelleToken) {
			return false;
		}

		if (!this.ablieferndeStelleToken.token) {
			return false;
		}

		if (!this.ablieferndeStelleToken.bezeichnung) {
			return false;
		}
		return true;
	}

	private _buildCrumbs(): void {
		let crumbs: any[] = this.crumbs = [];
		crumbs.push({iconClasses: 'glyphicon glyphicon-home', _url: this._url.getHomeUrl()});
		crumbs.push({
			label: this._txt.get('breadcrumb.behoerdenZugriff', 'Behörden-Zugriff')
		});
		crumbs.push({
			url: this._url.getNormalizedUrl('/behoerdenzugriff/token'),
			label: this._txt.get('breadcrumb.tokens', 'Access-Tokens')
		});

		if (this._mode === Mode.Add) {
			crumbs.push({
				url: this._url.getNormalizedUrl(`/behoerdenzugriff/tokendetail`),
				label: this._txt.get('breadcrumb.create', 'Erfassen')
			});
		}

		if (this._mode === Mode.Edit) {
			crumbs.push({
				url: this._url.getNormalizedUrl(`/behoerdenzugriff/tokendetail/${this.id}`),
				label: this._txt.get('breadcrumb.edit', 'Bearbeiten')
			});
		}
	}

	private _checkAndProcessId(id: any) {
		this.loading = true;
		this.id = id;
		this._mode = this.id ? Mode.Edit : Mode.Add;

		if (this._mode === Mode.Add) {
			this.ablieferndeStelleToken = new AblieferndeStelleToken();
			this.tokenHeaderName = this._txt.get('behoerdenZugriff.detail.addtokenheader', 'Hinzufügen');
			this.loading = false;
			return;
		}

		this.tokenHeaderName = this._txt.get('behoerdenZugriff.detail.edittokenheader', 'Bearbeiten');

		this.tokenService.getToken(id).subscribe(
			res => this._prepareResult(res),
			err => this._ui.showError(err),
			() => this.loading = false);
	}

	private _prepareResult(result: AsToken) {
		if (_util.isEmpty(result)) {
			return;
		}

		result.token.ablieferndeStellenKuerzel = this._getBehoerdenKuerzel(result.token);
		result.token.ablieferndeStellenBezeichnung = this._getBehoerdenBeschreibung(result.token);
		this.ablieferndeStelleToken = result.token;

		this._prepareAllTokenList(this._allTokens);
	}

	private _getBehoerdenBeschreibung(item: AblieferndeStelleToken): string {
		if (item == null) {
			return '';
		}
		return item.ablieferndeStelleList.map(a => a.bezeichnung).join(', ');
	}

	private _getBehoerdenKuerzel(item: AblieferndeStelleToken): string {
		if (item == null) {
			return '';
		}
		return item.ablieferndeStelleList.map(a => a.kuerzel).join(', ');
	}
}

export enum Mode {
	Add,
	Edit,
}
