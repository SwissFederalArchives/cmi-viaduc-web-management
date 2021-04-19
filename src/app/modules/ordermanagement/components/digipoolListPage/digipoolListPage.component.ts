import {ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {
	ConfigService, TranslationService, WijmoService, ApplicationFeatureEnum, DigitalisierungsKategorie,
	EntityDecoratorService, CmiGridComponent
} from '@cmi/viaduc-web-core';
import {CollectionView} from '@grapecity/wijmo';
import {DigipoolEntry} from '../../model';
import {OrderService} from '../../services';
import {AuthorizationService, UrlService, UiService, UserService, ErrorService} from '../../../shared/services';
import {Column, DataMap} from '@grapecity/wijmo.grid';
import {DigipoolUserSettings, ManagementUserSettings} from '../../../shared/model/managementUserSettings';
import {FlexGridFilter} from '@grapecity/wijmo.grid.filter';

@Component({
	selector: 'cmi-viaduc-digipoollist-page',
	templateUrl: 'digipoolListPage.component.html',
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./digipoolListPage.component.less']
})
export class DigipoolListPageComponent implements OnInit {
	public loading: boolean;
	public crumbs: any[] = [];
	public digipoolList: CollectionView;
	public columns: any[] = [];
	public showPriorisierungOverview = false;
	public showAufbereitungsfehlerZuruecksetzen = false;
	public setStatusSpezial = false;
	public selectedTerminDate: string;
	public selectedTerminTime: string;
	public valueFilters: any;

	@ViewChild('flexGrid', { static: false })
	public flexGrid: CmiGridComponent;

	@ViewChild('filter', { static: false })
	public filter: FlexGridFilter;

	private placeholderDate = 'dd.MM.yyyy';
	private placeholderTime = '12:00';

	constructor(private _orderService: OrderService,
				private _txt: TranslationService,
				private _url: UrlService,
				private _ui: UiService,
				private _aut: AuthorizationService,
				private _wjs: WijmoService,
				private _usr: UserService,
				private _cfg: ConfigService,
				private _dec: EntityDecoratorService,
				private _err: ErrorService,
				private _cdRef: ChangeDetectorRef) {
	}

	public ngOnInit(): void {
		this._buildCrumbs();
		this._loadColumns();
		this._loadDigipoolList();
	}

	public hasRight(): boolean {
		return this._aut.hasApplicationFeature(ApplicationFeatureEnum.AuftragsuebersichtAuftraegeView);
	}

	public get hasSelectedItems() {
		return this.flexGrid ? this.flexGrid.selectedItems.length > 0 : false;
	}

	public saveColumns() {
		let cols = [...this.columns];

		for (let c of cols) {
			let existing: Column = this.flexGrid.columns.filter(col => col.header === c.defaultLabel)[0];
			if (existing) {
				c.width = existing.renderWidth;
				c.format = existing.format;
				c.visible = true;
				c.index = existing.index;
			} else {
				c.visible = false;
				c.index = 999;
			}
		}

		let sortedArray = cols.sort((a, b) => {
			if (a.index > b.index) {
				return 1;
			}

			if (a.index < b.index) {
				return -1;
			}

			return 0;
		});

		this._saveColumnsAsUserSettings(sortedArray);
	}

	public refreshTable() {
		this._loadDigipoolList();
		this._loadColumns();
	}

	public resetColumnsToDefault() {
		this.columns = this._cfg.getSetting('digipool.digipoolListColumns', {}).map(x => Object.assign({}, x));
		this._saveColumnsAsUserSettings(this.columns);
		this._loadDigipoolList();

		if (this.flexGrid) {
			this.flexGrid.resetGridState();
		}
	}

	public showPriorisierungOverviewClick(): void {
		this.setStatusSpezial = false;
		this.selectedTerminDate = this.placeholderDate;
		this.selectedTerminTime = this.placeholderTime;

		this.showPriorisierungOverview = true;
	}

	public onCancelPriorisierungOverviewClick(event): void {
		this.showPriorisierungOverview = false;
	}

	public onSavePriorisierungOverviewClick(event): void {
		let selectedDigipoolItemsIds = this.flexGrid.selectedItems.map(i => i.orderItemId);

		let digitalisierungskategorie = null;
		if (this.setStatusSpezial) {
			digitalisierungskategorie = DigitalisierungsKategorie.Spezial;
		}

		let datum = null;
		if (this.selectedTerminDate !== undefined && this.selectedTerminDate !== null && this.selectedTerminDate !== this.placeholderDate) {
			datum = this.selectedTerminDate;
		}

		let zeit = this.placeholderTime;
		if (this.validateTime()) {
			zeit = this.selectedTerminTime;
		}

		this._orderService.updateDigiPool(selectedDigipoolItemsIds, digitalisierungskategorie, datum, zeit).subscribe(
			() => {
				this.refreshTable();
			},
			(e) => {
				this._err.showError(e);
			},
			() => { this.showPriorisierungOverview = false; });
	}

	public showAufbereitungsfehlerZuruecksetzenClick(): void {
		this.showAufbereitungsfehlerZuruecksetzen = true;
	}

	public onCancelAufbereitungsfehlerZuruecksetzenClick(event): void {
		this.showAufbereitungsfehlerZuruecksetzen = false;
	}

	public onYesAufbereitungsfehlerZuruecksetzenClick(event): void {
		let selectedDigipoolItemsIds = this.flexGrid.selectedItems.map(i => i.orderItemId);

		this._orderService.resetAufbereitungsfehler(selectedDigipoolItemsIds).subscribe(
			() => {
				this.refreshTable();
			},
			(e) => {
				this._err.showError(e);
			},
			() => { this.showAufbereitungsfehlerZuruecksetzen = false; });
	}

	public validateTime(): boolean {
		let regexp = new RegExp(/^([0-1][0-9]:[0-5][0-9])|([2][0-3]:[0-5][0-9])$/);
		return regexp.test(this.selectedTerminTime);
	}

	public get getAufbereitungsfehlerZuruecksetzenText(): string {
		if ( this.flexGrid && this.flexGrid.selectedItems.length === 1) {
			return this._txt.get('digipoolList.aufbereitungsfehlerTextSingleItem', 'Wollen Sie den Auftrag wirklich zurücksetzen?');
		}

		return this._txt.get('digipoolList.aufbereitungsfehlerTextMultipleItems', 'Wollen Sie die Aufträge wirklich zurücksetzen?');
	}

	private _buildCrumbs(): void {
		this.crumbs = [];
		this.crumbs.push({iconClasses: 'glyphicon glyphicon-home', url: this._url.getHomeUrl()});
		this.crumbs.push({
			url: this._url.getAuftragsuebersichtUrl(),
			label: this._txt.get('breadcrumb.orderings', 'Auftragsübersicht')
		});
	}

	private _loadDataMaps() {
		let maps: { [id: string]: DataMap; } = {};
		maps['digitalisierunskategorie'] = this._wjs.getDataMap(DigitalisierungsKategorie, this._dec.translateDigitalisierungsKategorie.bind(this)) as any;
		let prioFilter = [];
		for (let i = 1; i <= 9; i++) {
			prioFilter.push({key: i.toString(),  name: i.toString()});
		}
		maps['priority'] = new DataMap(prioFilter, 'key', 'name');

		maps['hasAufbereitungsfehler'] = new DataMap([
			{ key: true, name: 'Ja'},
			{ key: false, name: 'Nein'}
		], 'key', 'name');

		this.valueFilters = maps;
	}

	private _loadDigipoolList(): void {
		this.loading = true;
		this._loadDataMaps();

		this._orderService.getDigipool().subscribe(
			res => this._prepareResult(res),
			err => this._ui.showError(err),
			() => {
				this.loading = false;
			});
	}

	private _prepareResult(result: DigipoolEntry[]) {
		for (let item of result) {
			if (item.terminDigitalisierung) {
				item.terminDigitalisierung = new Date(item.terminDigitalisierung);
			}
		}
		this.digipoolList = new CollectionView(result);
		this.digipoolList.pageSize = 10;
		/* As selected items might get deselected the
		* getAufbereitungsfehlerZuruecksetzenText will change and produce a
		* Expression has changed after it was checked. error.
		* with that call we prevent the error. */
		this._cdRef.detectChanges();
	}

	private _loadColumns(): void {
		let userSettings = this._cfg.getSetting('user.settings') as ManagementUserSettings;
		if (userSettings.digipoolSettings && userSettings.digipoolSettings.columns) {
			this.columns = userSettings.digipoolSettings.columns;
		} else {
			this.resetColumnsToDefault();
		}
	}
	public resetSortsAndFilters() {
		this.flexGrid.filter.clear();
		this._loadDigipoolList();
	}

	private _saveColumnsAsUserSettings(cols) {
		let existingSettings = this._cfg.getUserSettings() as ManagementUserSettings;
		existingSettings.digipoolSettings = <DigipoolUserSettings> {
			columns: cols
		};
		this._usr.updateUserSettings(existingSettings);
	}

	private hasOnlySelectedItemsOfSpecificPriority(priority: number): boolean {
		let selectedItems = this.flexGrid.selectedItems.map(i => i.priority);
		let selectedOfPriority = selectedItems.filter( value => value === priority);
		return selectedItems.length === selectedOfPriority.length;
	}

	private hasSelectedItemsOfSpecificPriority(priority: number): boolean {
		let selectedOfPriority =  this.flexGrid.selectedItems.map(i => i.priority).filter( value => value === priority);
		return selectedOfPriority.length > 0;
	}

	public get allowPriorisierungAnpassenAusfuehren(): boolean {
		return this._aut.hasApplicationFeature(ApplicationFeatureEnum.AuftragsuebersichtDigipoolPriorisierungAnpassenAusfuehren) && this.hasSelectedItems && !this.hasSelectedItemsOfSpecificPriority(9);
	}

	public get allowAufbereitungsfehlerZuruecksetzen(): boolean {
		return this._aut.hasApplicationFeature(ApplicationFeatureEnum.AuftragsuebersichtDigipoolAufbereitungsfehlerZuruecksetzen) && this.hasSelectedItems && this.hasOnlySelectedItemsOfSpecificPriority(9);
	}
}
