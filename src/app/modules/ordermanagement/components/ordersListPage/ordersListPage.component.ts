import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {ApplicationFeatureEnum, ConfigService, InternalStatus, ShippingType, TranslationService, Utilities as _util} from '@cmi/viaduc-web-core';
import {AuthorizationService, ErrorService, UiService, UrlService, UserService} from '../../../shared/services';
import {OrderingFlatItem, SelectionPreFilter} from '../../model';
import {WjMenu} from '@grapecity/wijmo.angular2.input';
import {ManagementUserSettings, OrderUserSettings} from '../../../shared/model';
import {OrderService} from '../../services';
import {ToastrService} from 'ngx-toastr';
import {OrdersListComponent} from '../ordersList/ordersList.component';
import * as moment from 'moment';
import {SessionStorageService} from '../../../client/services';

@Component({
	selector: 'cmi-viaduc-orders-list-page',
	templateUrl: 'ordersListPage.component.html',
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./ordersListPage.component.less']
})
export class OrdersListPageComponent implements OnInit {
	@ViewChild('listMenu', { static: false })
	public listMenu: WjMenu;

	@ViewChild('preFilterMenu', { static: false })
	public preFilterMenu: WjMenu;

	@ViewChild('orderslist', { static: false })
	public ordersList: OrdersListComponent;

	public crumbs: any[] = [];
	public columns: any[] = [];
	public hiddenColumns: any[] = [];
	public visibleColumns: any[] = [];
	public preFilter: SelectionPreFilter = null;
	public SelectionPreFilter = SelectionPreFilter;
	public showColumnPicker = false;
	public showEntscheidHinterlegen = false;
	public showAuftraegeAbschliessen = false;
	public selectedInternalComment: string;
	public selectedBewilligungsDate: Date;
	public showAuftraegeAbbrechen = false;
	public showAuftraegeZuruecksetzen = false;
	public showAuftraegeAusleihen = false;
	public showAuftraegeReponieren = false;
	public showAuftraegeMahnungVersenden = false;
	public showBarCode = false;

	public hasRight = false;

	// @ts-ignore
	private barcodeSet: boolean;
	private _previousPreFilter: SelectionPreFilter = null;
	private _isInitializing = true;

	constructor(private _txt: TranslationService,
				private _url: UrlService,
				private _usr: UserService,
				private _ord: OrderService,
				private _ui: UiService,
				private _toastr: ToastrService,
				private _storage: SessionStorageService,
				private _err: ErrorService,
				private _aut: AuthorizationService,
				private _cfg: ConfigService) {
		this.hasRight = this._aut.hasApplicationFeature(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeView);
		this._isInitializing = true;
	}

	public ngOnInit(): void {
		this._buildCrumbs();
		this._loadColumns();
		this._initTableView();
	}

	private _resetColumnsToDefault() {
		this.columns = this._cfg.getSetting('orders.ordersListColumns', {}).map(x => Object.assign({}, x));
		this._saveColumnsAsUserSettings(this.columns);
	}

	private _loadColumns(): void {
		let userSettings = this._cfg.getSetting('user.settings') as ManagementUserSettings;
		if (userSettings.orderSettings && userSettings.orderSettings.columns) {
			this.columns = userSettings.orderSettings.columns;
		} else {
			this._resetColumnsToDefault();
		}
	}

	private _initTableView() {
		this.refreshHiddenVisibleColumns();
		this._restorePreFilterButtonState();
	}

	private _restorePreFilterButtonState() {
		setTimeout(() => {
			let filter = this._storage.getItem('AL_PreFilterButton') as SelectionPreFilter;
			if (filter !== null && filter !== undefined) {
				if (filter === SelectionPreFilter.Barcode) {
					this.barcodeSet = true;
				} else {
					this._previousPreFilter = filter;
				}
				setTimeout(() => {
					this.preFilter = filter;
					this._isInitializing = false;
				}, 50);
			} else {
				this.preFilter = filter;
				this._previousPreFilter = SelectionPreFilter.NurPendente;
				this._isInitializing = false;
			}
		}, 0);
	}

	private _buildCrumbs(): void {
		this.crumbs = [];
		this.crumbs.push({iconClasses: 'glyphicon glyphicon-home', url: this._url.getHomeUrl()});
		this.crumbs.push({
			url: this._url.getAuftragsuebersichtUrl(),
			label: this._txt.get('breadcrumb.orderings', 'Auftragsübersicht')
		});
	}

	public get selectedCount() {
		return this.ordersList ? this.ordersList.selectedRowsCount : 0;
	}

	public get selectedIds() {
		return this.ordersList ? this.ordersList.selectedIds : [];
	}

	public listMenuItemClicked(menu: WjMenu) {
		let cmd = menu.selectedIndex;
		switch (cmd) {
			case 0:
				this.saveColumns();
				return;
			case 1:
				this.exportExcel();
				return;
			case 2:
				this.showColumnPickerModal();
				return;
			case 3:
				this.resetSortsAndFilters();
				return;
			case 4:
				this.resetView();
				return;
			default:
				this._notImplementedYet();
				return;
		}
	}

	private _notImplementedYet() {
		alert('not implemented yet');
	}

	public preFilterItemClicked(changedObj:number | any) {
		if (!changedObj || this._isInitializing) {
			return;
		}
		if (this._previousPreFilter === this.preFilter) {
			return;
		}

		this._previousPreFilter = this.preFilter;
		this.preFilter = changedObj.value || changedObj;
		this._storage.setItem('AL_PreFilterButton', this.preFilter);

		switch (this.preFilter) {
			case SelectionPreFilter.NurPendente:
				this.barcodeSet = false;
				this.ordersList.showPendente();
				return;
			case SelectionPreFilter.Alle:
				this.barcodeSet = false;
				this.ordersList.showAll();
				return;
			case SelectionPreFilter.Barcode:
				this.barcodeSet = true;
				return;
			default:
				this._notImplementedYet();
				return;
		}
	}

	public _getVisibleColumns(): any[] {
		return this.columns.filter(c => c.visible);
	}

	public _getHiddenColumns(): any [] {
		return this.columns.filter(c => !c.visible);
	}

	public showColumn(c: any) {
		this.columns.filter(col => col.key === c.key)[0].visible = true;
		this.refreshHiddenVisibleColumns();
	}

	public hideColumn(c: any) {
		this.columns.filter(col => col.key === c.key)[0].visible = false;
		this.refreshHiddenVisibleColumns();
	}

	public refreshTable() {
		this.ordersList.refreshTable();
	}

	public saveColumns() {
		const cols = this.ordersList.getCurrentColumns();
		this._saveColumnsAsUserSettings(cols);
	}

	private _saveColumnsAsUserSettings(cols) {
		let existingSettings = this._cfg.getUserSettings() as ManagementUserSettings;
		existingSettings.orderSettings = <OrderUserSettings> {
			columns: cols
		};
		this._usr.updateUserSettings(existingSettings);
	}

	public refreshHiddenVisibleColumns() {
		this.visibleColumns = this._getVisibleColumns();
		this.hiddenColumns = this._getHiddenColumns();

		if (this.ordersList) {
			this.ordersList.refreshTable();
		}
	}

	public exportExcel() {
		this.ordersList.exportExcel();
	}

	public showColumnPickerModal() {
		this.showColumnPicker = true;
	}

	public resetView() {
		this._resetColumnsToDefault();
		this.refreshHiddenVisibleColumns();
		this.ordersList.ngOnInit();
		this.ordersList.resetSorts();
	}

	public showAushebungsAuftrag() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannAushebungsauftraegeDrucken)) {
			return;
		}
		const selectedItemids = this.ordersList.selectedIds;
		this._ord.getAushebungsAuftragHtml(selectedItemids).subscribe(html => {
			this._ui.showHtmlInNewTab(html, this._txt.get('aushebungsauftrag', 'Aushebungsauftrag'));
		});
	}

	public showVersandkontrolle() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeVersandkontrolleAusfuehren)) {
			return;
		}

		const selectedItemids = this.ordersList.selectedIds;
		this._ord.getVersandkontrolleHtml(selectedItemids).subscribe(html => {
			this._ui.showHtmlInNewTab(html, this._txt.get('versandkontrolle', 'Versandkontrolle'));
		});
	}

	public resetSortsAndFilters() {
		this.ordersList.resetFilters();
		this.ordersList.ngOnInit();
		this.ordersList.resetSorts(); // Reihenfolge ist wichtig!
	}

	public showEntscheidHinterlegenModal() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannEntscheidFreigabeHinterlegen)) {
			return;
		}

		this.selectedBewilligungsDate = null;
		this.selectedInternalComment = null;

		if (this.ordersList.selectedIds.length > 0) {
			const selectedItems = Array.from(this.ordersList.currentSelection.values());

			const bewilligungDates = selectedItems.map((i: OrderingFlatItem) => i.bewilligungsDatum);
			if (bewilligungDates && bewilligungDates.length > 0) {

				if (bewilligungDates.length > 1) {
					for (let d of bewilligungDates)	{
						if (!bewilligungDates[0] && d) {
							this._toastr.error('Ausgewählte Aufträge haben unterschiedliche Bewilligungsdaten', 'Freigabekontrolle');
							return;
						}

						if (!bewilligungDates[0] && !d) {
							continue;
						}

						if (!moment(d).isSame(moment(bewilligungDates[0]), 'day')) {
							this._toastr.error('Ausgewählte Aufträge haben unterschiedliche Bewilligungsdaten', 'Freigabekontrolle');
							return;
						}
					}
				}

				this.selectedBewilligungsDate = bewilligungDates[0];
			}

			const internalComments = selectedItems.map((i: OrderingFlatItem) => i.internalComment);
			if (internalComments && internalComments.length > 0) {
				if (internalComments.length > 1) {
					for (let c of internalComments)	{
						if (c !== internalComments[0]) {
							this._toastr.error('Ausgewählte Aufträge haben unterschiedliche interne Bemerkungen', 'Freigabekontrolle');
							return;
						}
					}
				}

				this.selectedInternalComment = internalComments[0];
			}

			this.showEntscheidHinterlegen = true;
		}
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

	public showAuftraegeZuruecksetzenModal() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeKannZuruecksetzen)) {
			return;
		}

		this.showAuftraegeZuruecksetzen = true;
	}

	public showMahnungVersendenModal() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeMahnungVersenden)) {
			return;
		}

		if (this.ordersList.selectedIds.length > 0) {
			const selectedItems = Array.from(this.ordersList.currentSelection.values());

			const filtered = selectedItems.filter((i: OrderingFlatItem) =>
				i.status !== InternalStatus.Ausgeliehen ||
				!(i.orderingType === ShippingType.Lesesaalausleihen || i.orderingType === ShippingType.Verwaltungsausleihe)
			);

			if (filtered.length > 0) {
				this._toastr.error(`Mindestens ein markierter Auftrag ist nicht vom Typ «Verwaltungsausleihen» oder «Lesesaalausleihen»
				und/oder er ist nicht im  internen Status «Ausgeliehen». Der erste fehlerhafte Auftrag hat die ID ${filtered[0].itemId}`,
					'Versand nicht erlaubt');
				return;
			}
		}

		this.showAuftraegeMahnungVersenden = true;
	}

	public showBarCodeModal() {
		if (!this._err.verifyApplicationFeatureOrShowError(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeBarcodesEinlesenAusfuehren)) {
			return;
		}

		this.showBarCode = true;
	}

	public barcodesChanged(value: string[]) {
		this.showBarCode = false;

		if (_util.isEmpty(value)) {
			this._toastr.warning('Es wurde keine Filterung vorgenommen, da keine Werte eingegeben wurden');
			return;
		}

		this.barcodeSet = true;

		setTimeout(() => {
			this.ordersList.barCodesFilter(value);
			this.preFilter = SelectionPreFilter.Barcode;
			this.preFilterItemClicked(SelectionPreFilter.Barcode);
			this._toastr.success('Die Aufträge wurden erfolgreich anhand der Barcodes gefiltert');
		}, 50);
	}
}
