import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {WjListBox} from '@grapecity//wijmo.angular2.input';
import {ApplicationFeatureEnum, ClientContext, ComponentCanDeactivate, CountriesService, HttpService, TranslationService, Utilities as _util} from '@cmi/viaduc-web-core';
import {
	AblieferndeStelleService, AuthorizationService, DetailPagingService, ErrorService, UiService, UrlService,
	UserService
} from '../../../shared/services';
import {AblieferndeStelle, DetailResult} from '../../../shared/model';
import {RoleService} from '../../services';
import * as fileSaver from 'file-saver';
import {HttpEventType} from '@angular/common/http';
import * as moment from 'moment';

import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {UserRolesDetailPageErrorMessages} from './userRolesDetailPageErrorMessages';

@Component({
	selector: 'cmi-viaduc-user-roles-detail-page',
	templateUrl: 'userRolesDetailPage.component.html',
	styleUrls: ['./userRolesDetailPage.component.less']
})
export class UserRolesDetailPageComponent extends ComponentCanDeactivate implements OnInit, AfterViewChecked {
	public errors: { [key: string]: string } = {};
	public loading: boolean;

	public crumbs: any[];
	public stillSelectedRoles: any;
	public stillAvailableRoles: any;
	private allRoles: any;
	private initialeRoles: any;
	public detail: DetailResult<any>;
	public preSelectedRolepublic: string;
	public selectedIdentifizierungsmittel: any;

	public language: any = [{name:'Deutsch', code:'de'}, {name:'Französisch', code:'fr'}, {name:'Italienisch', code:'it'}, {name:'Englisch', code:'en'}];
	private countries: any;

	public showModal: boolean;
	public showVerifyModal:boolean;

	@ViewChild('listExcluded', { static: false })
	public listExcluded: WjListBox;
	@ViewChild('listIncluded', { static: false })
	public listIncluded: WjListBox;
	public myForm: FormGroup;
	public ablieferndeStelleAllList: AblieferndeStelle[];
	private stillSelectedAblieferndeStelleList: any;
	private initialeAblieferndeStelleList: any;
	private rolesIsDirty: Boolean;

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
				private _changeDetectionRef: ChangeDetectorRef,
				private formbuilder: FormBuilder) {
		super();
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

	public include(): void {
		this.rolesIsDirty = true;
		const role = this.listExcluded.selectedItem;
		this.detail.item.roles.push(role);
		this._remove(this.stillAvailableRoles, role);
		this.listExcluded.refresh();
		this.listIncluded.refresh();
	}

	public exclude(): void {
		this.rolesIsDirty = true;
		const role = this.listIncluded.selectedItem;
		this._eiamRoleHandlingWarnungen(role.identifier);
		this.stillAvailableRoles.push(role);
		this._remove(this.detail.item.roles, role);
		this.listExcluded.refresh();
		this.listIncluded.refresh();
	}

	public ngAfterViewChecked(): void {
		this._changeDetectionRef.detectChanges();
	}

	public async saveUser(): Promise<void> {
		this.loading = true;
		this.reassembleDatatype();
		this._userService.updateAllUserData(this.detail.item).subscribe(
			async res => {
				this._ui.showSuccess(this._txt.get('userAndRoles.userSuccessfullySaved', 'Benutzerdaten erfolgreich gespeichert'));
				await this._reload();
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

	public async saveRoles(): Promise<void> {
		this.loading = true;

		const roleIds = [];
		for (let i = 0; i < this.detail.item.roles.length; i += 1) {
			roleIds.push(this.detail.item.roles[i].id);
		}

		this._roleService.setUserRoles(this.detail.item.id, roleIds).then(
			async res => {
				this.loading = false;
				this._ui.showSuccess(this._txt.get('userAndRoles.userroleSuccessfullySaved', 'Benutzerrollen erfolgreich gespeichert'));
				this.stillSelectedRoles = null;
				this.rememberSelectedAblieferndeStelle();
				await this._reload();
				this.rolesIsDirty = false;
			},
			err => {
				this.loading = false;
				this._ui.showError(this._txt.get('userAndRoles.userroleCouldNotBeSaved', 'Benutzerrollen konnte nicht gespeichert werden'), err.message);
			}
		);
	}

	public async saveAblieferndeStellen(): Promise<void> {
		this.loading = true;
		this.stillSelectedAblieferndeStelleList = null;
		const ablieferndeStelleIds = this.detail.item.ablieferndeStelleList != null ? this.detail.item.ablieferndeStelleList.map(as => as.ablieferndeStelleId) : [];
		this._userService.cleanAndAddAblieferndeStelle(this.detail.item.id, ablieferndeStelleIds).subscribe(
			async res => {
			let access = this.detail.item.access || {};
				this.detail.item.tokens = access.asTokens || [];
				this._ui.showSuccess(this._txt.get('userAndRoles.assignedAblieferndeStellenSuccessfullySaved', 'Zuständige Stellen erfolgreich gespeichert'));
				this.rememberSelectedRoles();
				await this._reload();
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

	public resetUserData(): void {
		this.myForm.reset();
		this.myForm.patchValue({
			familyName: this.detail.item.familyName,
			firstName: this.detail.item.firstName,
			organization: this.detail.item.organization,
			street: this.detail.item.street,
			streetAttachment: this.detail.item.streetAttachment,
			zipCode: this.detail.item.zipCode,
			town: this.detail.item.town,
			countryCode: this.detail.item.countryCode,
			phoneNumber: this.detail.item.phoneNumber,
			mobileNumber: this.detail.item.mobileNumber,
			birthday: this.detail.item.birthday,
			emailAddress: this.detail.item.emailAddress,
			fabasoftDossier: this.detail.item.fabasoftDossier,
			id: this.detail.item.id,
			userExtId: this.detail.item.userExtId,
			language: this.detail.item.language,
			downloadLimitDisabledUntil: this.detail.item.downloadLimitDisabledUntil,
			digitalisierungsbeschraenkungAufgehobenBis: this.detail.item.digitalisierungsbeschraenkungAufgehobenBis,
			createModifiyData: this.detail.item.createModifiyData,
			rolePublicClient: this.detail.item.rolePublicClient,
			researcherGroup: this.detail.item.researcherGroup,
			barInternalConsultation: this.detail.item.barInternalConsultation,
		});
		this.recalculateResearcherGroup();
	}

	public resetRoleManagement (): void {
		this.rolesIsDirty = false;
		this.detail.item.roles = [];
		this.stillAvailableRoles = [];
		this.distributeAssignedRoles(this.initialeRoles, this.detail.item.roles );
		this.listIncluded.refresh();
		this.listExcluded.refresh();
	}

	public resetAccessTokens(): void {
		this.detail.item.ablieferndeStelleList = [];
		if (this.initialeAblieferndeStelleList) {
			this.initialeAblieferndeStelleList.forEach(ablieferndeStelle => {
				this.detail.item.ablieferndeStelleList.push(ablieferndeStelle);
			});
		}
	}

	public goToBenutzerList(): void {
		// BT Abbrechen
		this._router.navigate([this._url.getNormalizedUrl('/benutzerundrollen/benutzer')]);
	}

	public get languageDependantCountries(): any {
		return this.countries;
	}

	public canManageManagementClientRole(eiamRoles: string): boolean {
		return this._authorization.hasRole(this._authorization.roles.APPO) && eiamRoles &&
			(eiamRoles.indexOf(this._authorization.roles.APPO) >= 0 || eiamRoles.indexOf(this._authorization.roles.ALLOW) >= 0 );
	}

	public researcherGroupDdsModalAnswer(value: boolean) {
		this.myForm.controls['researcherGroup'].setValue(value);
		this.myForm.controls['researcherGroup'].markAsDirty();
	}

	public oeDreiDisabled(): boolean {
		return !this.allowBenutzerrollePublicClientBearbeiten || !this.detail.item.hasIdentifizierungsmittel;
	}

	public asTokenManageDisabled(): boolean {
		return !this.detail.item.rolePublicClient || this.detail.item.rolePublicClient.indexOf(this._authorization.roles.AS) === -1;
	}

	public getCheckedStatusForRolePublic(value: string): boolean {
		return value && value.indexOf(this.myForm.controls['rolePublicClient'].value ) === 0;
	}

	public setCheckedStatusForRolePublic(value: string) {
		if (!value) {
			return;
		}

		// Forschungsgruppe DDS darf nicht für Ö2 gewählt werden
		if (value.indexOf(this._authorization.roles.Oe2) === 0) {
			this.myForm.controls['researcherGroup'].setValue(false);
		}

		this.myForm.controls['rolePublicClient'].setValue(value);
		this.myForm.controls['rolePublicClient'].markAsDirty();
	}

	public toggelSelectedResearcherGroup(e: MouseEvent): void {
		if (this.myForm.controls['researcherGroup'].value === false) {
			this.showVerifyModal = true;
			e.preventDefault();
		}
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
						fileSaver.saveAs(blob, this.detail.item.id + '.pdf', { autoBom: false });
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

				this._ui.showError(detailErrorMessage,  err.message);
			},
			() => {
				this.detail.item.hasIdentifizierungsmittel = true;
				this.setCheckedStatusForRolePublic(this._authorization.roles.Oe3);
				this.recalculateResearcherGroup();
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
				this.recalculateResearcherGroup();
				this.loading = false;
			}
		);
	}

	public onCancelClick(event): void {
		this.showModal = false;
	}

	public onOpenModalClick(event, rolePublicClient: string, allowOpenModal: boolean): void {
		// Auswahl muss zurückgesetzt werden, denn der effektive Wechsel muss im Dialog bestätigt werden
		this.setCheckedStatusForRolePublic(this.myForm.controls['rolePublicClient'].value);
		// Es kann nicht von Oe2 zu Oe3 gewechselt werden. Dies muss ueber ein PDF upload gemacht werden.
		if (rolePublicClient === this.myForm.controls['rolePublicClient'].value || !allowOpenModal) {
			return;
		}

		event.stopPropagation();
		event.preventDefault();

		this.preSelectedRolepublic = rolePublicClient;
		this.showModal = true;
	}

	public onOkClick(event): void {
		this.showModal = false;

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
	}

	public dateValidator(control: FormControl): any | null {
		if (control.value === null || control.value === '' || moment(control.value, 'DD.MM.YYYY', true).isValid()) {
			if (control.invalid) {
				control.setErrors(null);
				this.updateErrorMessages();
			}
			return null;
		}
		// return error object
		return {'invalidDate': {'value': control.value}};
	}

	public dateRangeValidator(control: FormControl): any | null {
		let dateString = control.value;
		if (!dateString || dateString === '' )  {
			if (control.invalid) {
				control.setErrors(null);
				this.updateErrorMessages();
			}
			return null;
		}

		if (this.getNextThirtyDays.findIndex(e => e === dateString) >= 0) {
			return null;
		}

		// return error object
		return {'invalidDateRange': {'value': control.value}};
	}

	public GetModalMessage(): string {
		switch (this.myForm.controls['rolePublicClient'].value) {
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
		switch (this.myForm.controls['rolePublicClient'].value) {
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

	public canDeactivate(): boolean {
		return !this.getFormIsDirty();
	}

	public promptForMessage(): false | 'question' | 'message' {
		return  'question';
	}

	public message(): string {
		return this._txt.get('hints.unsavedChanges', 'Sie haben ungespeicherte Änderungen. Wollen Sie die Seite tatsächlich verlassen?');
	}

	public getFormIsDirty():boolean {
		if (this.rolesIsDirty) {
			return true;
		}
		if (this.hasAblieferndeStelleListChanged()) {
			return true;
		}
		if (this.myForm) {
			// Form reagiert auf Datum Änderungen nicht mit dirty, wenn der Wert davor "null" war
			if (this.myForm.controls['digitalisierungsbeschraenkungAufgehobenBis'].value !== this.detail.item.digitalisierungsbeschraenkungAufgehobenBis ||
				this.myForm.controls['downloadLimitDisabledUntil'].value !== this.detail.item.downloadLimitDisabledUntil ) {
				return true;
			}
			return this.myForm.dirty;
		} else {
			return false;
		}
	}

	private async _reload(): Promise<void> {
		await this._load(this.detail.item.id);
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
		if (this.detail.item) {
			this.crumbs.push({label: this.detail.item.emailAddress});
		}
	}

	private _prepareResult(result: DetailResult<any>) {
		this.detail = result;
		this.stillAvailableRoles = [];
		/// User was saved without roles and roles were already changed
		if (this.stillSelectedRoles && this.initialeRoles) {
			this.detail.item.roles = [];
			this.distributeAssignedRoles(this.stillSelectedRoles, this.detail.item.roles);
		} else {
			this.initialeRoles = [];
			this.allRoles  = this.detail['roles'];
			this.distributeAssignedRoles(this.detail.item.roles, this.initialeRoles);
		}
		let access = result.item.access || {};
		result.item.tokens = access.asTokens || [];
		if (this.stillSelectedAblieferndeStelleList) {
			this.detail.item.ablieferndeStelleList = [];
			_util.forEach(this.stillSelectedAblieferndeStelleList, (ablieferndeStelleList) => {
				this.detail.item.ablieferndeStelleList.push(ablieferndeStelleList);
			});
		} else {
			this.initialeAblieferndeStelleList = [];
			_util.forEach(this.detail.item.ablieferndeStelleList, (ablieferndeStelleList) => {
				this.initialeAblieferndeStelleList.push(ablieferndeStelleList);
			});
		}
		this.detail.item.birthday = result.item.birthday ? moment(new Date(result.item.birthday)).format('DD.MM.YYYY') : null;
		let dateTime = moment(new Date()).add(-1, 'days').toDate();
		if (result.item.downloadLimitDisabledUntil) {
			let compareDownloadLimitDisabledUntil = moment(new Date(result.item.downloadLimitDisabledUntil));
			if (compareDownloadLimitDisabledUntil.diff(dateTime) > 0) {
				this.detail.item.downloadLimitDisabledUntil = moment(new Date(this.detail.item.downloadLimitDisabledUntil)).format('DD.MM.YYYY');
			} else {
				this.detail.item.downloadLimitDisabledUntil = null;
			}
		}
		if (result.item.digitalisierungsbeschraenkungAufgehobenBis) {
			let compareDigitalisierungsbeschraenkungAufgehobenBis = moment(new Date(result.item.digitalisierungsbeschraenkungAufgehobenBis));
			if (compareDigitalisierungsbeschraenkungAufgehobenBis.diff(dateTime) > 0) {
				this.detail.item.digitalisierungsbeschraenkungAufgehobenBis = moment(new Date(this.detail.item.digitalisierungsbeschraenkungAufgehobenBis)).format('DD.MM.YYYY');
			} else {
				this.detail.item.digitalisierungsbeschraenkungAufgehobenBis = null;
			}
		}
		this.initForm();
		this._buildCrumbs();
	}

	private distributeAssignedRoles(source: any, target: any) {
		if (source) {
			_util.forEach(source, (role) => {
				target.push(role);
			});
		}
		if (this.allRoles) {
			_util.forEach(this.allRoles, (role) => {
				this.stillAvailableRoles.push(role);
			});
		}
		if (source) {
			_util.forEach(source, (role) => {
				this._remove(this.stillAvailableRoles, role);
			});
		}
	}

	private updateErrorMessages() {
		this.errors = {};
		if ( this.myForm) {
			for (const message of UserRolesDetailPageErrorMessages) {
				const control = this.myForm.get(message.forControl);
				if (control &&
					control.dirty &&
					control.invalid &&
					control.errors[message.forValidator] &&
					!this.errors[message.forControl]) {
					this.errors[message.forControl] = this._txt.get(message.text, message.text);
				}
			}
		}
	}

	private initForm(): void {
		this.myForm = this.formbuilder.group({
			familyName: new FormControl({value: this.detail.item.familyName,
					disabled: (!this.allowBereichBenutzerdatenBearbeiten || this.detail.item.rolePublicClient === this._authorization.roles.Oe3 || this.detail.item.isInternalUser) },
				[Validators.required, Validators.maxLength(200)]),
			firstName: new FormControl({value: this.detail.item.firstName,
					disabled: (!this.allowBereichBenutzerdatenBearbeiten || this.detail.item.rolePublicClient === this._authorization.roles.Oe3) || this.detail.item.isInternalUser },
				[Validators.required, Validators.maxLength(200)]),
			organization: new FormControl({value: this.detail.item.organization, disabled: (!this.allowBereichBenutzerdatenBearbeiten || this.detail.item.isInternalUser) },
				[Validators.maxLength(200)]),
			street: new FormControl({value: this.detail.item.street, disabled: !this.allowBereichBenutzerdatenBearbeiten },
				[Validators.required, Validators.maxLength(200)]),
			streetAttachment: new FormControl({value: this.detail.item.streetAttachment, disabled: !this.allowBereichBenutzerdatenBearbeiten },
				[Validators.maxLength(200)]),
			zipCode:  new FormControl({ value: this.detail.item.zipCode, disabled: !this.allowBereichBenutzerdatenBearbeiten },
				[Validators.required, Validators.maxLength(200)]),
			town: new FormControl({ value: this.detail.item.town, disabled: !this.allowBereichBenutzerdatenBearbeiten},
				[Validators.required, Validators.maxLength(200)]),
			countryCode: new FormControl({ value: this.detail.item.countryCode, disabled: !this.allowBereichBenutzerdatenBearbeiten}),
			phoneNumber: new FormControl({ value: this.detail.item.phoneNumber,  disabled: !this.allowBereichBenutzerdatenBearbeiten},
				[Validators.pattern('^[()+]?([0-9][\\s()-]*){6,20}$')]),
			mobileNumber: new FormControl({ value: this.detail.item.mobileNumber,  disabled: !this.allowBereichBenutzerdatenBearbeiten},
				[Validators.pattern('^[()+]?([0-9][\\s()-]*){6,20}$')]),
			emailAddress:  new FormControl({value: this.detail.item.emailAddress, disabled: (!this.allowBereichBenutzerdatenBearbeiten || this.detail.item.isInternalUser)},
				[Validators.required, Validators.email, Validators.maxLength(200)]),
			fabasoftDossier:  new FormControl({value: this.detail.item.fabasoftDossier, disabled: !this.allowBereichBenutzerdatenBearbeiten}),
			id: [this.detail.item.id],
			userExtId: [this.detail.item.userExtId],
			downloadLimitDisabledUntil: [this.detail.item.downloadLimitDisabledUntil, [this.dateRangeValidator.bind(this), this.dateValidator.bind(this)]],
			digitalisierungsbeschraenkungAufgehobenBis: [this.detail.item.digitalisierungsbeschraenkungAufgehobenBis, [this.dateRangeValidator.bind(this), this.dateValidator.bind(this)]],
			language: [{value: this.detail.item.language, disabled: !this.allowBereichBenutzerdatenBearbeiten}],
			createModifiyData: [this.detail.item.createModifiyData],
			rolePublicClient: [{value: this.detail.item.rolePublicClient, disabled: !this.allowBereichBenutzerdatenBearbeiten}],
			birthday:[{value: this.detail.item.birthday,  disabled: (!this.allowBereichBenutzerdatenBearbeiten || this.detail.item.rolePublicClient === this._authorization.roles.Oe3 ) },
				[this.dateValidator.bind(this)]],
			researcherGroup: new FormControl({value: this.detail.item.researcherGroup,
					disabled: (this.detail.item.rolePublicClient !== this._authorization.roles.Oe3 || !this.detail.item.emailAddress.endsWith('@dodis.ch') || !this.allowForschungsgruppeDdsBearbeiten) }),
			barInternalConsultation: new FormControl({value: this.detail.item.barInternalConsultation,
				disabled: !this.allowBarInterneKonsultationBearbeiten})
		});
		if (this.detail.item.isInternalUser) {
			this.myForm.controls['organization'].setValidators([Validators.required, Validators.maxLength(200)]);
		}
		this.myForm.statusChanges.subscribe(() => this.updateErrorMessages());
	}

	private reassembleDatatype() {
		let detailItem = this.myForm.getRawValue();

		this.detail.item.familyName = detailItem.familyName;
		this.detail.item.firstName = detailItem.firstName;
		this.detail.item.organization = detailItem.organization;
		this.detail.item.street = detailItem.street;
		this.detail.item.streetAttachment = detailItem.streetAttachment;
		this.detail.item.zipCode = detailItem.zipCode;
		this.detail.item.town = detailItem.town;
		this.detail.item.countryCode = detailItem.countryCode;
		this.detail.item.phoneNumber = detailItem.phoneNumber;
		this.detail.item.mobileNumber = detailItem.mobileNumber;
		this.detail.item.birthday = detailItem.birthday;
		this.detail.item.emailAddress = detailItem.emailAddress;
		this.detail.item.fabasoftDossier = detailItem.fabasoftDossier;
		this.detail.item.id = detailItem.id;
		this.detail.item.userExtId = detailItem.userExtId;
		this.detail.item.downloadLimitDisabledUntil = detailItem.downloadLimitDisabledUntil;
		this.detail.item.digitalisierungsbeschraenkungAufgehobenBis = detailItem.digitalisierungsbeschraenkungAufgehobenBis;
		this.detail.item.language = detailItem.language;
		this.detail.item.rolePublicClient = detailItem.rolePublicClient;
		this.detail.item.researcherGroup = detailItem.researcherGroup;
		this.detail.item.barInternalConsultation = detailItem.barInternalConsultation;
		this.rememberSelectedRoles();
		this.rememberSelectedAblieferndeStelle();
		this.detail.item.roles = this.initialeRoles;
		this.detail.item.ablieferndeStelleList = this.initialeAblieferndeStelleList;
	}

	private rememberSelectedRoles() {
		this.stillSelectedRoles = [];
		_util.forEach(this.detail.item.roles, (role) => {
			this.stillSelectedRoles.push(role);
		});
	}

	private rememberSelectedAblieferndeStelle() {
		this.stillSelectedAblieferndeStelleList = [];
		_util.forEach(this.detail.item.ablieferndeStelleList, (ablieferndeStelleList) => {
			this.stillSelectedAblieferndeStelleList.push(ablieferndeStelleList);
		});
	}

	private async _load(id: string): Promise<void> {
		this.loading = true;
		try {
			let res = await this._roleService.getUserInfo(id);
			this._prepareResult(res);
		} catch (err) {
			this._ui.showError(err);
		}

		this.loading = false;
	}

	private _eiamRoleHandlingWarnungen(roleIdentifier:any) {
		// Falls ApplicationOwner oder Standard Rolle entfernt wird muss eine Meldung gezeigt werden, denn die werden beim Login automatisch wieder ergänzt
		if (roleIdentifier === 'Standard' && this.detail.item.eiamRoles === this._authorization.roles.ALLOW) {
			this._ui.showWarning(this._txt.get('usersAndRoles.warning.remove.standard', 'Achtung! Die «Standardrolle» wird dem Benutzer der Applikation automatisch wieder zugewiesen, ' +
				'solange in eIAM für den Management-Client die Rolle «ALLOW» hinterlegt ist. ' +
				'Falls Sie dem Benutzer die «Standardrolle» entziehen möchten, entfernen Sie bitte in der eIAM-Rollenverwaltung die Rolle «ALLOW»'));
		}
	}

	public get getNextThirtyDays(): string[] {
		let days = [];
		for (let i = 0; i <= moment().daysInMonth(); i++) {
			days.push(moment().add(i, 'days').format('DD.MM.YYYY'));
		}
		return days;
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
		return this.myForm.controls['rolePublicClient'].value === this._authorization.roles.Oe3;
	}

	private hasAblieferndeStelleListChanged(): boolean {

		const ablieferndeStelleIds = this.detail.item.ablieferndeStelleList != null ? this.detail.item.ablieferndeStelleList.map(as => as.ablieferndeStelleId) : [];
		if (this.initialeAblieferndeStelleList.length === this.detail.item.ablieferndeStelleList.length) {
			let length = this.initialeAblieferndeStelleList.length;
			for (let i = 0; i < length; i++) {
				if (ablieferndeStelleIds.indexOf(this.initialeAblieferndeStelleList[i].ablieferndeStelleId) < 0) {
					return true;
				}
			}
		} else {
			return true;
		}
		return false;
	}

	public recalculateResearcherGroup() {
		if (!this.myForm.controls['emailAddress'].value.endsWith('@dodis.ch')) {
			// Forschungsgruppe DDS muss @dodis.ch Endung haben
			this.myForm.controls['researcherGroup'].setValue(false);
			this.myForm.controls['researcherGroup'].disable();
		} else if (this.editUserHasOe3Role && this.allowForschungsgruppeDdsBearbeiten) {
			this.myForm.controls['researcherGroup'].enable();
		} else {
			this.myForm.controls['researcherGroup'].disable();
		}
	}
}
