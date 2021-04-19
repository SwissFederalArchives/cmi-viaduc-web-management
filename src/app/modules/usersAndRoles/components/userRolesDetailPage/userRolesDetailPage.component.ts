import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {WjListBox} from '@grapecity//wijmo.angular2.input';
import {ApplicationFeatureEnum, ClientContext, CountriesService, HttpService, TranslationService, Utilities as _util} from '@cmi/viaduc-web-core';
import {
	AblieferndeStelleService, AuthorizationService, DetailPagingService, ErrorService, UiService, UrlService,
	UserService
} from '../../../shared/services';
import {AblieferndeStelle, DetailResult} from '../../../shared/model';
import {RoleService} from '../../services';
import * as fileSaver from 'file-saver';
import {HttpEventType} from '@angular/common/http';
import * as moment from 'moment';

@Component({
	selector: 'cmi-viaduc-user-roles-detail-page',
	templateUrl: 'userRolesDetailPage.component.html',
	styleUrls: ['./userRolesDetailPage.component.less']
})
export class UserRolesDetailPageComponent implements OnInit, AfterViewChecked {

	public loading: boolean;

	public crumbs: any[];
	public detail: DetailResult<any>;

	private _hasChanges: boolean;
	public selectedRolepublic: string;
	public preSelectedRolepublic: string;
	public selectedResearcherGroup: boolean;
	public selectedResearcherGroupOld: boolean;
	public selectedBarInternalConsultation: boolean;
	public selectedIdentifizierungsmittel: any;

	// https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
	public emailRegexPattern: string = '^[a-zA-Z0-9.!#$%&\'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$';
	public phonenumberRegexPattern: string = '^[()+]?([0-9][\\s()-]*){6,20}$';

	public language: any = [{name:'Deutsch', code:'de'}, {name:'Französisch', code:'fr'}, {name:'Italienisch', code:'it'}, {name:'Englisch', code:'en'}];
	private countries: any;

	public showModal: boolean;
	public showVerifyModal:boolean;

	public get hasChanges(): boolean {
		return this._hasChanges;
	}

	public set hasChanges(value: boolean) {
		this._hasChanges = value;
		this.listExcluded.refresh();
		this.listIncluded.refresh();
	}

	@ViewChild('listExcluded', { static: false })
	public listExcluded: WjListBox;
	@ViewChild('listIncluded', { static: false })
	public listIncluded: WjListBox;

	public ablieferndeStelleAllList: AblieferndeStelle[];

	constructor(private _context: ClientContext, public _authorization: AuthorizationService, private _roleService: RoleService, private _txt: TranslationService,
				private _url: UrlService,
				private _route: ActivatedRoute,
				private _router: Router,
				private _ui: UiService,
				private _ablieferndeStelleService: AblieferndeStelleService,
				private _userService: UserService, private _countriesService: CountriesService,
				private _http: HttpService,
				private _dps: DetailPagingService,
				private _errService: ErrorService,
				private _changeDetectionRef: ChangeDetectorRef) {
	}

	public ngOnInit(): void {
		this._route.params.subscribe(params => this._load(params['id']));
		this.loading = true;
		this._ablieferndeStelleService.getAllAblieferndeStellen().subscribe(
			res => this.ablieferndeStelleAllList = res,
			err => {
				this.loading = false;
				this._ui.showError(err);
			},
			() => this.loading = false);

		let countries = this._countriesService.getCountries(this._context.language);
		this.countries = this._countriesService.sortCountriesByName(countries);
	}

	public ngAfterViewChecked(): void {
		this._changeDetectionRef.detectChanges();
	}

	public include(): void {
		const role = this.listExcluded.selectedItem;
		this.detail.item.roles.push(role);
		this._remove(this.detail['roles'], role);
		this.hasChanges = true;
	}

	public exclude(): void {
		const role = this.listIncluded.selectedItem;
		this._eiamRoleHandlingWarnungen(role.identifier);
		this.detail['roles'].push(role);
		this._remove(this.detail.item.roles, role);
		this.hasChanges = true;
	}

	public saveUser(): void {
		this.loading = true;

		// Checkbox Wert abfüllen für Mapping bzw. speichern
		this.detail.item.rolePublicClient = this.selectedRolepublic;
		this.detail.item.researcherGroup = this.selectedResearcherGroup;
		this.detail.item.barInternalConsultation = this.selectedBarInternalConsultation;

		this._userService.updateAllUserData(this.detail.item).subscribe(
			res => {
				this._ui.showSuccess(this._txt.get('userAndRoles.userSuccessfullySaved', 'Benutzerdaten erfolgreich gespeichert'));
				this._reload();
			},
			err => {
				this.loading = false;
				this._errService.showError(err);
			},
			() => {
				this.loading = false;
			}
		);
	}

	public saveRoles(): void {
		this.loading = true;

		const roleIds = [];
		for (let i = 0; i < this.detail.item.roles.length; i += 1) {
			roleIds.push(this.detail.item.roles[i].id);
		}

		this._roleService.setUserRoles(this.detail.item.id, roleIds).then(
			res => {
				this.loading = false;
				this._ui.showSuccess(this._txt.get('userAndRoles.userroleSuccessfullySaved', 'Benutzerrollen erfolgreich gespeichert'));
				this._reload();
			},
			err => {
				this.loading = false;
				this._ui.showError(this._txt.get('userAndRoles.userroleCouldNotBeSaved', 'Benutzerrollen konnte nicht gespeichert werden'), err.message);
			}
		);
	}

	public saveAblieferndeStellen(): void {
		this.loading = true;
		const ablieferndeStelleIds = this.detail.item.ablieferndeStelleList != null ? this.detail.item.ablieferndeStelleList.map(as => as.ablieferndeStelleId) : [];

		this._userService.cleanAndAddAblieferndeStelle(this.detail.item.id, ablieferndeStelleIds).subscribe(
			res => {
				let access = this.detail.item.access || {};
				this.detail.item.tokens = access.asTokens || [];
				this._ui.showSuccess(this._txt.get('userAndRoles.assignedAblieferndeStellenSuccessfullySaved', 'Zuständige Stellen erfolgreich gespeichert'));
				this._reload();
			},
			err => {
				this.loading = false;
				this._ui.showError(this._txt.get('userAndRoles.assignedAblieferndeStellenNotBeSaved', 'Zuständige Stellen konnte nicht gespeichert werden'), err.message);
			},
			() => {
				this.loading = false;
			}
		);
	}

	public reset(): void {
		this._reload();
	}

	public goToBenutzerList(): void {
		this._router.navigate([this._url.getNormalizedUrl('/benutzerundrollen/benutzer')]);
	}

	public get languageDependantCountries(): any {
		return this.countries;
	}

	public canManageManagementClientRole(eiamRoles: string): boolean {
		return this._authorization.hasRole(this._authorization.roles.APPO) && eiamRoles &&
			(eiamRoles.indexOf(this._authorization.roles.APPO) >= 0 || eiamRoles.indexOf(this._authorization.roles.ALLOW) >= 0 );
	}

	public researcherGroupDdsDisabled(): boolean {
		return this.editUserHasOe3Role ||
			!this.detail.item.emailAddress.endsWith('@dodis.ch') || !this.allowForschungsgruppeDdsBearbeiten;
	}

	public researcherGroupDdsModalAnswer(value: boolean) {
		this.selectedResearcherGroupOld = value;
		this.selectedResearcherGroup = value;
	}

	public oeDreiDisabled(): boolean {
		return !this.allowBenutzerrollePublicClientBearbeiten || !this.detail.item.hasIdentifizierungsmittel;
	}

	public asTokenManageDisabled(): boolean {
		return !this.detail.item.rolePublicClient || this.detail.item.rolePublicClient.indexOf(this._authorization.roles.AS) === -1;
	}

	public getCheckedStatusForRolePublic(value: string): boolean {
		return value && value.indexOf(this.selectedRolepublic) === 0;
	}

	public setCheckedStatusForRolePublic(value: string) {
		if (!value) {
			return;
		}

		// Forschungsgruppe DDS darf nicht für Ö2 gewählt werden
		if (value.indexOf(this._authorization.roles.Oe2) === 0) {
			this.selectedResearcherGroup = false;
		}

		this.selectedRolepublic = value;
	}

	public toggelSelectedResearcherGroup(): void {
		if (this.selectedResearcherGroupOld === false) {
			this.showVerifyModal = true;
			event.preventDefault();
		}
		this.selectedResearcherGroupOld = false;
		this.selectedResearcherGroup = false;
	}

	public toggelSelectedBarInternalConsultation(): void {
		this.selectedBarInternalConsultation = this.selectedBarInternalConsultation === true;
	}

	public onChangedentIfierungsmittel(event) {
		if (event.target.files.length === 0) {
			return;
		}
		const formData = new FormData();
		for (let file of event.target.files) {
			formData.append(file.name, file);
		}
		this.selectedIdentifizierungsmittel = formData;
	}

	public downloadIdentifierungsmittel() {
		this.loading = true;
		let url = this._userService.getIdentifizierungsmittelPdfUrl(this.detail.item.id);
		this._http.download(url).subscribe(
			event => {
				if (event.type === HttpEventType.Response) {
					try {
						this.loading = false;
						let blob = event.body;
						fileSaver.saveAs(blob, this.detail.item.id + '.pdf');
					} catch (ex) {
						console.error(ex);
					}
				}
			},
			(error) => {
				this.loading = false;
				this._ui.showError(this._txt.get('userAndRoles.downloadfail', 'Identifizierungsmittel konnte nicht geladen werden'), error.message);
			},
			() => {
				this.loading = false;
			});
	}

	public uploadIdentifierungsmittel() {
		this.loading = true;
		this._userService.setIdentifizierungsmittelPdf(this.detail.item.id, this._authorization.roles.Oe3, this.selectedIdentifizierungsmittel).subscribe(
			res => {
				this._ui.showSuccess(this._txt.get('userAndRoles.uploadsuccess', 'Identifizierungsmittel erfolgreich gespeichert'));
			},
			err => {
				this.loading = false;
				const detailErrorMessage = err.error && err.error.message ? this._txt.get('userAndRoles.uploadfail', 'Identifizierungsmittel konnte nicht gespeichert werden') +
					' (' + err.error.message + ')' :
					this._txt.get('userAndRoles.uploadfail', 'Identifizierungsmittel konnte nicht gespeichert werden');
				this._ui.showError(detailErrorMessage, err.message);
			},
			() => {
				this.detail.item.hasIdentifizierungsmittel = true;
				this.setCheckedStatusForRolePublic(this._authorization.roles.Oe3);
				this.selectedIdentifizierungsmittel = null;
				this.loading = false;
			}
		);
	}

	public downgradToOe2() {
		this.loading = true;
		this._userService.setIdentifizierungsmittelPdf(this.detail.item.id, this._authorization.roles.Oe2, null).subscribe(
			res => {
				this._ui.showSuccess(this._txt.get('userAndRoles.downgradsuccess', 'Identifizierungsmittel erfolgreich gelöscht'));
				this.detail.item.hasIdentifizierungsmittel = null;
			},
			err => {
				this.loading = false;
				this._ui.showError(this._txt.get('userAndRoles.downgradfail', 'Identifizierungsmittel konnte nicht gelöscht werden'), err.message);
			},
			() => {
				this.detail.item.hasIdentifizierungsmittel = false;
				this.setCheckedStatusForRolePublic(this._authorization.roles.Oe2);
				this.selectedIdentifizierungsmittel = null;
				this.loading = false;
			}
		);
	}

	public onCancelClick(event): void {
		this.showModal = false;
	}

	public onOpenModalClick(event, rolePublicClient: string, allowOpenModal: boolean): void {
		if (rolePublicClient === this.selectedRolepublic || !allowOpenModal) {
			return;
		}

		event.stopPropagation();
		event.preventDefault();

		this.preSelectedRolepublic = rolePublicClient;
		// Auswahl muss zurückgesetzt werden, denn der effektive Wechsel muss im Dialog bestätigt werden
		this.setCheckedStatusForRolePublic(this.selectedRolepublic);
		this.showModal = true;
	}

	public onOkClick(event): void {
		switch (this.preSelectedRolepublic) {
			case this._authorization.roles.Oe2:
				this.downgradToOe2();
				break;
			case this._authorization.roles.Oe3:
				this.uploadIdentifierungsmittel();
				break;
			case this._authorization.roles.BVW:
				this.setCheckedStatusForRolePublic(this._authorization.roles.BVW);
				break;
			case this._authorization.roles.AS:
				this.setCheckedStatusForRolePublic(this._authorization.roles.AS);
				break;
			case this._authorization.roles.BAR:
				this.setCheckedStatusForRolePublic(this._authorization.roles.BAR);
				break;
			default:
				throw new Error();
		}

		this.showModal = false;
	}

	public GetModalMessage(): string {
		switch (this.selectedRolepublic) {
			case this._authorization.roles.Oe2:
				return this._txt.get('user.upload.oe2ToOe3Message', 'Nach erfolgtem Upload des Identifizierungsnachweises als PDF-Datei ' +
					'erfolgt ein automatischer Rollenwechsel durch das System. Der Benutzer erhält durch den Rollenwechsel erweiterte Rechte. Möchten Sie fortfahren?');
			case this._authorization.roles.Oe3:
				return this._txt.get('user.upload.oe3ToOe2Message', 'Die Identifizierungsausweise werden dauerhaft gelöscht. Möchten Sie fortfahren?');
			case this._authorization.roles.BVW:
				return this._txt.get('user.upload.bvwToAsOrBarMessage', 'Der Benutzer erhält durch den Rollenwechsel erweiterte Rechte. Möchten Sie fortfahren?');
			case this._authorization.roles.AS:
				if (this.preSelectedRolepublic === this._authorization.roles.BVW) {
					return this._txt.get('user.upload.asToBvwMessage', 'Die dem Benutzer zugewiesenen Verlinkungen auf die zuständigen Stellen werden dauerhaft gelöscht. ' +
						'Der Benutzer verliert dadurch seine erweiterten Rechte. Wollen Sie fortfahren?');
				} else if (this.preSelectedRolepublic === this._authorization.roles.BAR) {
					return this._txt.get('user.upload.asToBarMessage', 'Die dem Benutzer zugewiesenen Verlinkungen auf die zuständigen Stellen werden dauerhaft gelöscht. ' +
						'Der Benutzer erhält durch den Rollenwechsel erweiterte Rechte. Möchten Sie fortfahren?');
				}
				break;
			case this._authorization.roles.BAR:
				return this._txt.get('user.upload.barToBvwMessage', 'Der Benutzer verliert dadurch seine erweiterten Rechte. Möchten Sie fortfahren?');
			default:
				return 'Keine Text';
		}
	}

	public GetModalTitel(): string {
		switch (this.selectedRolepublic) {
			case this._authorization.roles.Oe2:
				return this._txt.get('user.upload.toOe3Title', 'Upload Identifizierungsmittel');
			case this._authorization.roles.Oe3:
				return this._txt.get('user.upload.toOe2Title', 'Rolle zu Ö2 zurückstufen');
			case this._authorization.roles.BVW:
				return this._txt.get('user.upload.toAsOrBarTitle', 'Rollenwechsel erweiterte Rechte');
			case this._authorization.roles.AS:
				if (this.preSelectedRolepublic === this._authorization.roles.BVW) {
					return this._txt.get('user.upload.asToBvwTitle', 'Rolle zu BVW zurückstufen');
				}
				if (this.preSelectedRolepublic === this._authorization.roles.BAR) {
					return this._txt.get('user.upload.asToBarTitle', 'Rollenwechsel erweiterte Rechte');
				}
				break;
			case this._authorization.roles.BAR:
				if (this.preSelectedRolepublic === this._authorization.roles.BVW) {
					return this._txt.get('user.upload.barToBvwTitle', 'Rolle zu BVW zurückstufen');
				}
				if (this.preSelectedRolepublic === this._authorization.roles.AS) {
					return this._txt.get('user.upload.barToAsTitle', 'Rolle zu AS zurückstufen');
				}
				break;
			default:
				return 'Titel';
		}
	}

	public detailPagingEnabled(): boolean {
		return this._dps.getCurrentIndex() > -1;
	}

	public getDetailBaseUrl(): string {
		return this._url.getBenutzerUebersichtUrl();
	}

	private _reload(): void {
		this._load(this.detail.item.id);
	}

	private _remove(items: any[], item: any): void {
		_util.remove(items, i => i.id === item.id);
	}

	private _buildCrumbs(): void {
		this.crumbs = [];
		this.crumbs.push({iconClasses: 'glyphicon glyphicon-home', url: this._url.getHomeUrl()});
		this.crumbs.push({
			url: this._url.getNormalizedUrl('/benutzerundrollen'),
			label: this._txt.get('breadcrumb.usersAndRoles', 'Benutzer und Rollen')
		});
		this.crumbs.push({
			url: this._url.getNormalizedUrl('/benutzerundrollen/benutzer'),
			label: this._txt.get('breadcrumb.usersRoles', 'Benutzerverwaltung')
		});
		if (this.detail && this.detail.item) {
			this.crumbs.push({label: this.detail.item.emailAddress});
		}
	}

	private _prepareResult(result: DetailResult<any>) {
		const roles = result['roles'];
		const item = result.item;
		if (item) {
			_util.forEach(item['roles'], (role) => {
				this._remove(roles, role);
			});
		}

		let access = result.item.access || {};
		result.item.tokens = access.asTokens || [];

		this.selectedRolepublic = result.item.rolePublicClient;
		this.selectedResearcherGroup = result.item.researcherGroup;
		this.selectedBarInternalConsultation = result.item.barInternalConsultation;

		this.detail = result;
		this.detail.item.birthday = this.detail.item.birthday ? moment(new Date(this.detail.item.birthday)).format('DD.MM.YYYY') : null;
		this.detail.item.downloadLimitDisabledUntil = this.detail.item.downloadLimitDisabledUntil
			? moment(new Date(this.detail.item.downloadLimitDisabledUntil)).format('DD.MM.YYYY')
			: null;

		this.detail.item.digitalisierungsbeschraenkungAufgehobenBis = this.detail.item.digitalisierungsbeschraenkungAufgehobenBis
			? moment(new Date(this.detail.item.digitalisierungsbeschraenkungAufgehobenBis)).format('DD.MM.YYYY')
			: null;
		this._hasChanges = false;

		this._buildCrumbs();
	}

	private async _load(id: string): Promise<void> {
		this.loading = true;

		this._roleService.getUserInfo(id).then(
			res => {
				this.loading = false;
				this.selectedResearcherGroupOld = res.item.researcherGroup;
				this._prepareResult(res);
			},
			err => {
				this.loading = false;
				this._ui.showError(err);
			}
		);
	}

	private _eiamRoleHandlingWarnungen(roleIdentifier:any) {
		// Falls ApplicationOwner oder Standard Rolle entfernt wird muss eine Meldung gezeigt werden, denn die werden beim Login automatisch wieder ergänzt
		if (roleIdentifier === 'Standard' && this.detail.item.eiamRoles === this._authorization.roles.ALLOW) {
			this._ui.showWarning(this._txt.get('usersAndRoles.warning.remove.standard', 'Achtung! Die «Standardrolle» wird dem Benutzer der Applikation automatisch wieder zugewiesen, ' +
				'solange in eIAM für den Management-Client die Rolle «ALLOW» hinterlegt ist. ' +
				'Falls Sie dem Benutzer die «Standardrolle» entziehen möchten, entfernen Sie bitte in der eIAM-Rollenverwaltung die Rolle «ALLOW»'));
		}
	}

	public getNextThirtyDays(): string[] {
		let days = [];
		for (let i = 0; i <= moment().daysInMonth(); i++) {
			days.push(moment().add(i, 'days').format('DD.MM.YYYY'));
		}
		return days;
	}

	public isValidDate(dateString: string): boolean {
		if (!dateString) {
			return true;
		}
		const pattern = '^(?:(?:31(\\/|-|\\.)(?:0?[13578]|1[02]))\\1|(?:(?:29|30)(\\/|-|\\.)(?:0?[1,3-9]|1[0-2])\\2))(?:(?:1[6-9]|[2-9]\\d)?\\d{2})$' +
		'|^(?:29(\\/|-|\\.)0?2\\3(?:(?:(?:1[6-9]|[2-9]\\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\\d|2[0-8])' +
		'(\\/|-|\\.)(?:(?:0?[1-9])|(?:1[0-2]))\\4(?:(?:1[6-9]|[2-9]\\d)?\\d{2})$';
		let rex = new RegExp(pattern, 'i');
		return rex.test(dateString);
	}

	public isInValidRange(dateString: string): boolean {
		if (!dateString) {
			return true;
		}

		return this.getNextThirtyDays().findIndex(e => e === dateString) >= 0;
	}

	public get allowBarInterneKonsultationBearbeiten(): boolean {
		return this._authorization.hasApplicationFeature(ApplicationFeatureEnum.BenutzerUndRollenBenutzerverwaltungFeldBarInterneKonsultationBearbeiten);
	}

	public get allowDownloadbeschraenkungBearbeiten(): boolean {
		return this._authorization.hasApplicationFeature(ApplicationFeatureEnum.BenutzerUndRollenBenutzerverwaltungFeldDownloadbeschraenkungBearbeiten);
	}

	public get allowDigitalisierungsbeschraenkungBearbeiten(): boolean {
		return this._authorization.hasApplicationFeature(ApplicationFeatureEnum.BenutzerUndRollenBenutzerverwaltungFeldDigitalisierungsbeschraenkungBearbeiten);
	}

	public get allowUploadAusfuehren(): boolean {
		return this._authorization.hasApplicationFeature(ApplicationFeatureEnum.BenutzerUndRollenBenutzerverwaltungUploadAusfuehren);
	}

	public get allowHerunterladenAusfuehren(): boolean {
		return this._authorization.hasApplicationFeature(ApplicationFeatureEnum.BenutzerUndRollenBenutzerverwaltungHerunterladenAusfuehren);
	}

	public get allowBenutzerrollePublicClientBearbeiten(): boolean {
		return this._authorization.hasApplicationFeature(ApplicationFeatureEnum.BenutzerUndRollenBenutzerverwaltungFeldBenutzerrollePublicClientBearbeiten);
	}

	public get allowBereichBenutzerdatenBearbeiten(): boolean {
		return this._authorization.hasApplicationFeature(ApplicationFeatureEnum.BenutzerUndRollenBenutzerverwaltungBereichBenutzerdatenBearbeiten);
	}

	public get allowZustaendigeStelleBearbeiten(): boolean {
		return this._authorization.hasApplicationFeature(ApplicationFeatureEnum.BenutzerUndRolleBenutzerverwaltungZustaendigeStelleEdit);
	}

	public get allowForschungsgruppeDdsBearbeiten(): boolean {
		return this._authorization.hasApplicationFeature(ApplicationFeatureEnum.BenutzerUndRollenBenutzerverwaltungFeldForschungsgruppeDdsBearbeiten);
	}

	public get editUserHasOe3Role(): boolean {
		return this.selectedRolepublic.indexOf(this._authorization.roles.Oe3) === -1 ;
	}
}
