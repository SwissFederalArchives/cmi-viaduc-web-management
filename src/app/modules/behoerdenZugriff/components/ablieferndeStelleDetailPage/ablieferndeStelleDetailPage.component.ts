import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslationService, Utilities as _util} from '@cmi/viaduc-web-core';
import {AblieferndeStelleService, UrlService, UiService} from '../../../shared/services';
import {AblieferndeStelle} from '../../../shared/model/ablieferndeStelle';
import {TokenService} from '../../services';
import {AsToken} from '../../model/asToken';
import {AblieferndeStelleToken} from '../../../shared/model/ablieferndeStelleToken';
import {WjListBox} from '@grapecity/wijmo.angular2.input';
import {FormControl, NgModel} from '@angular/forms';

@Component({
	selector: 'cmi-viaduc-ablieferndestelle-page-edit',
	templateUrl: 'ablieferndeStelleDetailPage.component.html',
	styleUrls: ['ablieferndeStelleDetailPage.component.less']
})

export class AblieferndeStelleDetailPageComponent implements OnInit {
	public crumbs: any[] = [];
	public ablieferndeStelleHeaderName: string;
	public id: any;
	public errors: string[];
	public ablieferndeStelle: AblieferndeStelle;
	public tokenList: AsToken;
	public loading: boolean;
	public selectedKontrollstelle = '';

	private _mode: ModeD;

	@ViewChild('wjListbox', { static: false })
	public wjListbox: WjListBox;

	@ViewChild('newKontrollstelle', { static: false })
	public newKontrollstelle: FormControl;

	@ViewChild('bezeichnung', { static: false })
	public bezeichnung: NgModel;

	@ViewChild('kuerzel', { static: false })
	public kuerzel: NgModel;

	public hasKontrollstelle: boolean = true;

	public showDeleteModal: boolean = false;
	public emailToDelete: string;

	public saveClicked: boolean = false;
	public showConfirmModal: boolean = false;

	constructor(private _ablieferndeStelleService: AblieferndeStelleService,
				private _tokenService: TokenService,
				private _txt: TranslationService,
				private _url: UrlService,
				private _ui: UiService,
				private _route: ActivatedRoute,
				private _router: Router) {
	}

	public ngOnInit(): void {
		this._route.params.subscribe(params => this._checkAndProcessId(params['id']));
		this._buildCrumbs();
		this._reload();
	}

	private _reload() {
		this.saveClicked = false;
		this._tokenService.getAllTokens().subscribe(
			res => this._fillDisplayNameAsToken(res),
			err => this._ui.showError(err));
	}

	public async processChanges(): Promise<void> {
		this.saveClicked = true;

		if (!this._validateData()) {
			this._clearAndAddError(this._txt.get('behoerdenZugriff.detail.fieldsRequireValues', 'Es wurden nicht alle Pflichtfelder ausgefüllt'));
			return;
		}

		if (this.ablieferndeStelle.ablieferndeStelleTokenList != null) {
			this.ablieferndeStelle.tokenIdList = [];
			this.ablieferndeStelle.tokenIdList = this.ablieferndeStelle.ablieferndeStelleTokenList.map(a => a.tokenId);
		}

		try {
			if (this._mode === ModeD.Add) {
				await this._ablieferndeStelleService.createAblieferndeStelle(this.ablieferndeStelle);
				this._ui.showSuccess('Erfolgreich gespeichert.');
				this.goToAblieferndeStelleList();
				return;
			} else {
				await this._ablieferndeStelleService.updateAblieferndeStelle(this.ablieferndeStelle);
				this._ui.showSuccess('Erfolgreich gespeichert.');
			}

			this.errors = [];
			this._reload();
		} catch (error) {
			if (error.error instanceof Error) {
				this._clearAndAddError(error.error.message);
			} else {
				this._clearAndAddError(error.message);
			}
		}
	}

	public get hasErrors(): boolean {
		return this.errors && this.errors.length > 0;
	}

	public goToAblieferndeStelleList(): void {
		this._router.navigate([this._url.getNormalizedUrl('/behoerdenzugriff/zustaendigestellen')]);
	}

	public goToUserDetail(id: any): void {
		this._router.navigate([this._url.getNormalizedUrl('/benutzerundrollen/benutzer') + '/' + id]);
	}

	private _clearAndAddError(error: string): void {
		this.errors = [];
		this.errors.push(error);
	}

	private _validateData(): boolean {
		if (!this.ablieferndeStelle) {
			return false;
		}

		this.kuerzel.control.markAsDirty({ onlySelf: true });
		this.bezeichnung.control.markAsDirty({ onlySelf: true });

		if (this.kuerzel.invalid) {
			return false;
		}

		if (this.bezeichnung.invalid) {
			return false;
		}

		if (_util.isEmpty(this.ablieferndeStelle.ablieferndeStelleTokenList)) {
			return false;
		}

		if (this.hasKontrollstelle && _util.isEmpty(this.ablieferndeStelle.kontrollstellen)) {
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
			url: this._url.getNormalizedUrl('/behoerdenzugriff/zustaendigestellen'),
			label: this._txt.get('breadcrumb.zustaendigestellen', 'Zuständige Stellen')
		});

		if (this._mode === ModeD.Add) {
			crumbs.push({
				url: this._url.getNormalizedUrl(`/behoerdenzugriff/zustaendigestelledetail`),
				label: this._txt.get('breadcrumb.create', 'Erfassen')
			});
		}

		if (this._mode === ModeD.Edit) {
			crumbs.push({
				url: this._url.getNormalizedUrl(`/behoerdenzugriff/zustaendigestelledetail/${this.id}`),
				label: this._txt.get('breadcrumb.edit', 'Bearbeiten')
			});
		}
	}

	private _checkAndProcessId(id: any) {
		this.loading = true;
		this.id = id;
		this._mode = this.id ? ModeD.Edit : ModeD.Add;

		if (this._mode === ModeD.Add) {
			console.log(id);
			this.ablieferndeStelle = new AblieferndeStelle();
			this.hasKontrollstelle = true;
			this.ablieferndeStelleHeaderName = this._txt.get('behoerdenZugriff.detail.addablieferndestelleheader', 'Hinzufügen');
			this.ablieferndeStelle.ablieferndeStelleTokenList = [];
			this.loading = false;
			return;
		}

		this.ablieferndeStelleHeaderName = this._txt.get('behoerdenZugriff.detail.editablieferndestelleheader', 'Bearbeiten');
		this._ablieferndeStelleService.getAblieferndeStelle(id).subscribe(
			res => this._prepareResult(res),
			err => this._ui.showError(err),
			() => this.loading = false);
	}

	private _prepareResult(result: AblieferndeStelle) {
		if (_util.isEmpty(result)) {
			return;
		}

		result.applicationUserAsString = this._getUserBeschreibung(result);
		result.ablieferndeStelleTokenAsString = this._getTokenBeschreibung(result);
		this.hasKontrollstelle = !_util.isEmpty(result.kontrollstellen);
		this.ablieferndeStelle = result;

		this._fillDisplayNameAblieferndeStelleToken(this.ablieferndeStelle.ablieferndeStelleTokenList);
	}

	private _getUserBeschreibung(item: AblieferndeStelle): string {
		if (item == null) {
			return '';
		}
		return item.applicationUserList.map(a => a.firstName + ' ' + a.familyName).join(', ');
	}

	private _getTokenBeschreibung(item: AblieferndeStelle): string {
		if (item == null) {
			return '';
		}
		return item.ablieferndeStelleTokenList.map(a => a.token).join(', ');
	}

	private _fillDisplayNameAsToken(res: AsToken): void {
		for (let item of res.tokens) {
			item.displayName = `${item.token} (${item.bezeichnung})`;
		}

		res.tokens = this._sortTokens(res.tokens);
		this.tokenList = res;
	}

	private _sortTokens(tokens: AblieferndeStelleToken[]): AblieferndeStelleToken[] {
		let sortedTokenNames = tokens.map(t => t.displayName).sort();
		let resultTokens = [];
		sortedTokenNames.forEach(tokenDisplayName =>
			resultTokens.push(tokens.find(token =>
				token.displayName === tokenDisplayName)
			)
		);
		return resultTokens;
	}

	private _fillDisplayNameAblieferndeStelleToken(res: AblieferndeStelleToken[]): void {
		for (let item of res) {
			item.displayName = `${item.token} (${item.bezeichnung})`;
		}
	}

	public addKontrollstelle() {
		if (_util.isEmpty(this.selectedKontrollstelle)) {
			return;
		}

		if (_util.isEmpty(this.ablieferndeStelle.kontrollstellen)) {
			this.ablieferndeStelle.kontrollstellen = [this.selectedKontrollstelle];
		} else {
			this.ablieferndeStelle.kontrollstellen.push(this.selectedKontrollstelle);
		}

		this.wjListbox.refresh();
		this.newKontrollstelle.reset();
	}

	public showDeleteModalClick(email: string) {
		this.emailToDelete = email;
		this.showDeleteModal = true;
	}

	public removeKontrollstelle(email: string) {
		let index = this.ablieferndeStelle.kontrollstellen.indexOf(email);
		if (index >= 0) {
			this.ablieferndeStelle.kontrollstellen.splice(index, 1);
			this.wjListbox.refresh();
		}
	}

	public showConfirmModalClick() {
		this.showConfirmModal = true;
	}

	public setNoKontrollstellen() {
		this.ablieferndeStelle.kontrollstellen = [];
		this.hasKontrollstelle = false;
		this.showConfirmModal = false;
	}

	public cancelConfirmModal() {
		// canceling the selected option
		this.hasKontrollstelle = true;

		this.showConfirmModal = false;
	}
}

export enum ModeD {
	Add,
	Edit,
}
