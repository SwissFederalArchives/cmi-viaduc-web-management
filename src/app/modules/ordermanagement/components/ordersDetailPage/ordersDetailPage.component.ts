import {Component, HostListener, ViewEncapsulation} from '@angular/core';
import {
	ApproveStatus,
	EntityDecoratorService,
	ApplicationFeatureEnum,
	ShippingType,
	TranslationService,
	Abbruchgrund, StammdatenService, ArtDerArbeit, Reason, EntscheidGesuchStatus, GebrauchskopieStatus
} from '@cmi/viaduc-web-core';
import {
	AuthorizationService,
	DetailPagingService,
	ErrorService,
	FileDownloadService,
	UiService,
	UrlService
} from '../../../shared/services';
import {
	Bestellhistorie, OrderingFlatDetailItem, OrderingFlatItem,
	StatusHistory
} from '../../model';
import {OrderService} from '../../services';
import {ActivatedRoute} from '@angular/router';
import * as moment from 'moment';
import {ToastrService} from 'ngx-toastr';

@Component({
	selector: 'cmi-viaduc-orders-list-page',
	templateUrl: 'ordersDetailPage.component.html',
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./ordersDetailPage.component.less']
})
export class OrdersDetailPageComponent {

	public loading: boolean;
	public crumbs: any[] = [];
	public detailRecord: OrderingFlatDetailItem;
	public historyItems: Bestellhistorie[];

	public fieldInfos: any[];
	public showEntscheidHinterlegen = false;
	public showOrderHistoryModal = false;
	public showAuftraegeAbschliessen = false;
	public showAuftraegeZuruecksetzen = false;
	public showAuftraegeAbbrechen: boolean;
	public showAuftraegeReponieren: boolean;
	public showAuftraegeAusleihen = false;
	public artDerArbeiten: ArtDerArbeit[];
	public detailPagingEnabled: boolean;
	public reasons: Reason[] = [];
	public gebrauchskopieStatus: any[] = [];

	public isNavFixed = false;

	private _recordId: number;

	constructor(private _aut: AuthorizationService,
				private _dec: EntityDecoratorService,
				private _ord: OrderService,
				private _url: UrlService,
				private _file: FileDownloadService,
				private _dps: DetailPagingService,
				private _stm: StammdatenService,
				private _toastr: ToastrService,
				private _ui: UiService,
				private _err: ErrorService,
				private _txt: TranslationService,
				private _route: ActivatedRoute) {

		this._route.params.subscribe(params => {
			this._recordId = params['id'];
			this._init();
		});
		this._stm.getArtDerArbeiten().subscribe((arbeiten) => {
			this.artDerArbeiten = arbeiten;
		});
		this._stm.getReasons().subscribe((reasons) => {
			this.reasons = reasons;
		});
		this.gebrauchskopieStatus = [
			{ 'id': GebrauchskopieStatus.NichtErstellt, 'name': this._txt.get('enums.gebrauchskopieStatus.nichtErstellt', ' ') },
			{ 'id': GebrauchskopieStatus.ErfolgreichErstellt, 'name': this._txt.get('enums.gebrauchskopieStatus.erfolgreichErstellt', 'Erfolgreich erstellt') },
			{ 'id': GebrauchskopieStatus.Fehlgeschlagen, 'name': this._txt.get('enums.gebrauchskopieStatus.fehlgeschlagen', 'Fehlgeschlagen') },
			{ 'id': GebrauchskopieStatus.Versendet, 'name': this._txt.get('enums.gebrauchskopieStatus.versendet', 'Versendet') }
		];
	}

	private _init(): void {
		this.loading = true;
		this.detailPagingEnabled = this._dps.getCurrentIndex() > -1;
		this._ord.getOrderingDetail(this._recordId).subscribe(r => {
			this.loading = false;
			this.detailRecord = r;
			this._buildCrumbs();
			this._ord.getAuftragOrderingDetailFields().subscribe(fields => {
				this.fieldInfos = fields;
			});
		});
	}

	private _buildCrumbs(): void {
		this.crumbs = [];
		this.crumbs.push({iconClasses: 'glyphicon glyphicon-home', url: this._url.getHomeUrl()});
		this.crumbs.push({
			url: this._url.getAuftragsuebersichtUrl(),
			label: this._txt.get('breadcrumb.orderings', 'Auftragsübersicht')
		});
		this.crumbs.push({
			url: this._url.getAuftragsuebersichtUrl() + '/' + this.detailRecord.itemId,
			label: this.detailRecord.dossiertitel
		});
	}

	public hasRight(): boolean {
		return this._aut.hasApplicationFeature(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeView);
	}

	public getExternalStatus(): string {
		return this._dec.translateExternalStatus(this.detailRecord.externalStatus);
	}

	public getInternalStatus(): string {
		return this._dec.translateInternalStatus(this.detailRecord.status);
	}

	public getOrderType(type: ShippingType): string {
		return this._dec.translateOrderingType(type);
	}

	public getApproveStatus(status: ApproveStatus): string {
		return this._dec.translateApproveStatus(status);
	}

	public getFormattedStatusHistoryDate(h: StatusHistory): string {
		return moment.utc(h.statusChangeDate).format('DD.MM.YYYY, HH:mm:ss');
	}

	public getAbbruchgrund(type: Abbruchgrund): string {
		return this._dec.translateAbbruchgrund(type);
	}

	public getEingangsart(art: number): string {
		return art === 0 ? 'Durch Kunde erfasst' : 'Durch BAR erfasst';
	}

	public getFormattedDate(dt: Date | string) {
		return dt ? moment.utc(dt).format('DD.MM.YYYY, HH:mm:ss') : '';
	}

	public getFormattedStatusHistoryToStatus(h: StatusHistory): string {
		return this._dec.translateInternalStatus(h.toStatus);
	}

	public getDigitalisierungsKategorie(): string {
		if (!this.detailRecord.digitalisierungsKategorie) {
			return '';
		}

		return this._dec.translateDigitalisierungsKategorie(this.detailRecord.digitalisierungsKategorie);
	}

	public loadOrderHistoryModal(): void {
		this._ord.getOrderingHistoryForVe(this.detailRecord.veId).subscribe(r => {
			this.historyItems = r;
			this.showOrderHistoryModal = true;
		});
	}

	public updateOrderDetail() {
		this._ord.auftragUpdateOrderingDetail(this.detailRecord as OrderingFlatItem).subscribe(() => {
			this.reset();
			this._toastr.success(this._txt.get('ordersDetailPage.updateSuccess', 'Erfolgreich gespeichert'));
		}, (e) => {
			this._toastr.error(this._txt.get('ordersDetailPage.updateError', 'Fehler beim Speichern'));
		});
	}

	public reset() {
		this._init();
	}

	public notImplementedYet(): void {
		alert('Not implemented yet');
	}

	public getEntscheidGesuch(entscheid: EntscheidGesuchStatus) {
		return this._dec.translateEntscheidGesuchStatus(entscheid);
	}

	public updateReason(val: number) {
		this.detailRecord.reason = this.reasons.find(r => r.id === val).name;
		this.detailRecord.reasonId = val;
	}

	public updatGebrauchskopieStatus(val: number) {
		this.detailRecord.gebrauchskopieStatus = val;
	}

	public getDateAsString(field: any): string {
		if (field) {
			const val = moment.utc(field).format('DD.MM.YYYY');
			return (val === '01.01.0001') ? null : val;
		}
		return null;
	}

	public setStringAsDate(str: string, key: string): void {
		this.detailRecord[key] = (str && str.length > 0) ? moment.utc(str, 'DD.MM.YYYY').toDate() : null;
	}

	public setStringAsDateTime(str: string, key: string): void {
		this.detailRecord[key] = (str && str.length > 0) ? moment.utc(str, 'DD.MM.YYYY, HH:mm:ss').toDate() : null;
	}
	public getDateTimeAsString(field: any): string {
		if (field) {
			const val = moment.utc(field).format('DD.MM.YYYY, HH:mm:ss');
			return (val === '01.01.0001, 00:00:00') ? null : val;
		}
		return null;
	}

	public getDetailBaseUrl(): string {
		return this._url.getAuftragsuebersichtUrl();
	}

	public isFieldReadonly(field: string) {
		const info = this.fieldInfos.filter(i => i.name.toLowerCase() === field.toLowerCase())[0];
		if (info) {
			return info.isReadonly;
		}
		return true;
	}

	public showAushebungsAuftrag() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannAushebungsauftraegeDrucken)) {
			return;
		}

		const selectedItemids = [this._recordId];
		this._ord.getAushebungsAuftragHtml(selectedItemids).subscribe(html => {
			this._ui.showHtmlInNewTab(html, this._txt.get('aushebungsauftrag', 'Aushebungsauftrag'));
		});
	}

	public showVersandkontrolle() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeVersandkontrolleAusfuehren)) {
			return;
		}

		const selectedItemids = [this._recordId];
		this._ord.getVersandkontrolleHtml(selectedItemids).subscribe(html => {
			this._ui.showHtmlInNewTab(html, this._txt.get('versandkontrolle', 'Versandkontrolle'));
		});
	}

	public seeHiddenOrderDetail() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeViewNichtSichtbar)) {
			return;
		}

		this._ord.getUnHiddenOrderingDetail(this._recordId).subscribe(item => {
			this.detailRecord = item;
			this._toastr.success(this._txt.get('order.seeHiddenOrderDetail', 'Die Daten wurden erfolgreich aufgedeckt.'),
				this._txt.get('', 'Daten einsehen'));
			this._buildCrumbs();
		});
	}

	public showEntscheidFreigabeHinterlegenModal() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannEntscheidFreigabeHinterlegen)) {
			return;
		}
		this.showEntscheidHinterlegen = true;
	}

	public showAuftraegeAbschliessenModal() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannAbschliessen)) {
			return;
		}

		this.showAuftraegeAbschliessen = true;
	}

	public showAuftraegeAbbrechenModal() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannAbbrechen)) {
			return;
		}

		this.showAuftraegeAbbrechen = true;
	}

	public showAuftraegeZuruecksetzenModal() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannZuruecksetzen)) {
			return;
		}

		this.showAuftraegeZuruecksetzen = true;
	}

	public showAuftraegeAusleihenModal() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannAuftraegeAusleihen)) {
			return;
		}

		this.showAuftraegeAusleihen = true;
	}

	public showAuftraegeReponierenModal() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannReponieren)) {
			return;
		}

		this.showAuftraegeReponieren = true;
	}

	public downloadGebrauchskopie() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannDownloadGebrauchskopieAusfuehren)) {
			return;
		}

		if (!this.verifyGebrauchskopieStatus()) {
			return;
		}

		this._file.downloadFile(this.detailRecord.itemId).subscribe(() => {
			this._ui.showSuccess(this._txt.get('orderDetailPage.downloadSuccess', 'Der Download wurde erfolgreich ausgelöst.'),
				this._txt.get('orderDetailPage.downloadSuccessTitle', 'Erfolgreich ausgelöst'));
		},
		(error) => {
			this.handleDownloadError(error);
		});
	}

	private verifyGebrauchskopieStatus(): boolean {
		if (this.detailRecord && (this.detailRecord.gebrauchskopieStatus === GebrauchskopieStatus.NichtErstellt ||
			this.detailRecord.gebrauchskopieStatus === GebrauchskopieStatus.Versendet)) {
				this._toastr.error(
					this._txt.get('orderDetailPage.wrongGebrauchskopieStatus',
					'Die Gebrauchskopie kann nur heruntergeladen werden, wenn der Status auf "Erfolgreich erstellt" oder "Fehlgeschlagen" steht.'),
					this._txt.get('orderDetailPage.wrongGebrauchskopieStatusTitle', 'Download nicht möglich'), { tapToDismiss:true});
				return false;
			}
		return true;
	}
	private handleDownloadError(error: any) {
		if (error.status === 410) {
			this._ui.showError(this._txt.get('orderDetailPage.downloadGone', 'Die Gebrauchskopie ist nicht mehr im Cache vorhanden.'),
				this._txt.get('orderDetailPage.downloadGoneTitle', 'Nicht vorhanden'));
			return;
		}

		this._err.showError(error, this._txt.get('orderDetailPage.downloadFail', 'Gebrauchskopie konnte nicht heruntergeladen werden.'));
	}

	@HostListener('window:scroll', ['$event'])
	public onScroll(event) {
		const verticalOffset = window.pageYOffset
			|| document.documentElement.scrollTop
			|| document.body.scrollTop || 0;

		if (verticalOffset >= 222) {
			// make nav fixed
			this.isNavFixed = true;
			return;
		}

		if (this.isNavFixed) {
			this.isNavFixed = false;
		}
	}
}
