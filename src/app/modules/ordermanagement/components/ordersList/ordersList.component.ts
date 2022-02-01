import {Component, Input, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {
	ApproveStatus,
	ClientContext, CoreOptions, EntityDecoratorService, ExternalStatus, InternalStatus, ShippingType,
	WijmoService, TranslationService, Utilities as _util, Abbruchgrund, EntscheidGesuchStatus, StammdatenService,
	ZugaenglichkeitGemaessBga, Eingangsart, DigitalisierungsKategorie, CmiGridComponent, GebrauchskopieStatus
} from '@cmi/viaduc-web-core';
import {Column, DataMap} from '@grapecity//wijmo.grid';
import {DetailPagingService, ErrorService, UrlService} from '../../../shared/services';
import {ODataCollectionView} from '@grapecity/wijmo.odata';
import {DataType, SortDescription} from '@grapecity/wijmo';
import {OrderingFlatItem} from '../../model';
import {WjMenu} from '@grapecity/wijmo.angular2.input';
import {Router} from '@angular/router';
import {forkJoin} from 'rxjs';
import {map} from 'rxjs/operators';
import {SessionStorageService} from '../../../client/services';

@Component({
	selector: 'cmi-viaduc-orders-list',
	templateUrl: 'ordersList.component.html',
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./ordersList.component.less']
})
export class OrdersListComponent implements OnInit {
	@Input()
	public isEinsichtsGesuchListe: boolean;
	@Input()
	public columns: any[] = [];
	@Input()
	public visibleColumns: any[] = [];

	@ViewChild('listMenu', { static: false })
	public listMenu: WjMenu;
	@ViewChild('flexGrid', { static: true })
	public flexGrid: CmiGridComponent;

	public loading: boolean;

	public get checkedRowsCount(): number {
		if (this.flexGrid) {
			return this.flexGrid.checkedItems.length;
		}

		return 0;
	}

	public get checkedRowsIds(): number[] {
		if (this.flexGrid) {
			return this.flexGrid.checkedItems.map(i => i.itemId);
		}

		return [];
	}

	public get currentChecked(): OrderingFlatItem[] {
		if (this.flexGrid) {
			return this.flexGrid.checkedItems;
		}

		return [];
	}

	public orderFlatItems: ODataCollectionView;
	public baseFilterString;
	public preFilterString;
	public valueFilters: any;

	private _reasonList: DataMap = undefined;
	private _artDerArbeitList: DataMap = undefined;

	constructor(private _url: UrlService,
				private _dec: EntityDecoratorService,
				private _wjs: WijmoService,
				private _dps: DetailPagingService,
				private _opt: CoreOptions,
				private _err: ErrorService,
				private _rtr: Router,
				private _storage: SessionStorageService,
				private _txt: TranslationService,
				private _ctx: ClientContext,
				private _stamm: StammdatenService) {
		this.loading = true;
	}

	public ngOnInit(): void {
		this._initTableView();
		this._createFilterMaps().then((m) => {
			this.valueFilters =	m;
		});
	}

	private _getSessionStoragePrefix(): string {
		return this.isEinsichtsGesuchListe ? 'EGL_' : 'AL_';
	}

	private _initTableView() {
		this.refreshHiddenVisibleColumns();

		this.preFilterString = this._storage.getItem<string>(`${this._getSessionStoragePrefix()}preFilterString`);
		this.baseFilterString = this.isEinsichtsGesuchListe ? '(orderingType eq 4)' : '(orderingType ne 4)';

		this.orderFlatItems = new ODataCollectionView(this._opt.odataUrl, 'OrderingFlatItems', {
			requestHeaders: this._ctx.getRequestHeaders(),
			fields: this.columns.filter(x => x.key !== 'unknown').map(x => x.key), // load all fields from server (regardless if visible or not), because some actions depends on them
			dataTypes: {
				orderingLesesaalDate: DataType.Date,
				orderingDate: DataType.Date,
				bewilligungsDatum: DataType.Date,
				erwartetesRueckgabeDatum: DataType.Date,
				abschlussdatum: DataType.Date,
				ausgabedatum: DataType.Date,
				datumDesEntscheids: DataType.Date
			},
			canFilter: true,
			canSort: true,
			sortOnServer: true,
			pageOnServer: true,
			filterOnServer: true,
			filterDefinition: this.baseFilterString,
			pageSize: 10
		});

		this.orderFlatItems.error.addHandler((view, error) => {
			this._err.showOdataErrorIfNecessary(error);
		});

		this.orderFlatItems.loading.addHandler(() => {
			this.loading = true;
		});
		this.orderFlatItems.loaded.addHandler(() => {
			this.loading = false;
		});
	}

	private _getInitialSortDescriptions(): any[] {
		let firstCol = this.visibleColumns.find(c => c.key === 'itemId');
		if (firstCol) {
			return [new SortDescription(firstCol.key, false)];
		}

		return [];
	}

	private _createFilterMaps(): Promise<any> {
		let obs = forkJoin([
			this._stamm.getReasons().pipe(map(r => {
				let pairs = [];
				r.forEach(item => pairs.push({ name: item.name}));
				return new DataMap(pairs, 'name', 'name');
			})),
			this._stamm.getArtDerArbeiten().pipe(map(a => {
				let pairs = [];
				a.forEach(item => pairs.push({name: item.name}));
				return new DataMap(pairs, 'name', 'name');
			}))]);

		return obs.toPromise().then(res => {
				this._reasonList = res[0] as DataMap;
				this._artDerArbeitList = res[1] as DataMap;

				let maps: { [id: string]: DataMap; } = {};
				maps['orderingType'] = this._wjs.getDataMap(ShippingType, this._dec.translateOrderingType.bind(this));
				maps['eingangsart'] = this._wjs.getDataMap( Eingangsart, this._dec.translateEingangsart.bind(this));
				maps['status'] =  this._wjs.getDataMap(InternalStatus, this._dec.translateInternalStatus.bind(this));
				maps['externalStatus'] =  this._wjs.getDataMap(ExternalStatus, this._dec.translateExternalStatus.bind(this));
				maps['approveStatus'] =  this._wjs.getDataMap(ApproveStatus, this._dec.translateApproveStatus.bind(this));
				maps['abbruchgrund'] =  this._wjs.getDataMap(Abbruchgrund, this._dec.translateAbbruchgrund.bind(this));
				maps['digitalisierungsKategorie'] =  this._wjs.getDataMap(DigitalisierungsKategorie, this._dec.translateDigitalisierungsKategorie.bind(this));
				maps['entscheidGesuch'] =  this._wjs.getDataMap(EntscheidGesuchStatus, this._dec.translateEntscheidGesuchStatus.bind(this));
				maps['gebrauchskopieStatus'] =  this._wjs.getDataMap(GebrauchskopieStatus, this._dec.translateGebrauchskopieStatus.bind(this));
				maps['orderingArtDerArbeit'] = this._artDerArbeitList;
				maps['reason'] = this._reasonList;

				// Zugänglichkeit ist ein Textfeld, weshalb die Namenseigenschaft gleichzeitif für die Anzeige und die Suche verwendet wird
				const  zugaenglichkeitMap = this._wjs.getDataMap(ZugaenglichkeitGemaessBga, this._dec.translateZugaenglichkeitGemaessBga.bind(this));
				maps['zugaenglichkeitGemaessBga'] = new DataMap(zugaenglichkeitMap.collectionView, 'name', 'name');

				maps['benutzungskopie'] = new DataMap([
					{ key: null, name: 'Unbekannt'},
					{ key: true, name: 'Ja'},
					{ key: false, name: 'Nein'}
				], 'key', 'name');

				maps['publikationsrechte'] = new DataMap([
					{name: 'BAR'},
					{name: 'Dritte'},
					{name: 'Prüfung nötig'}
				], 'name', 'name');

				return maps;
			});
	}

	public onFilterApplied(ev) {
		if (!_util.isEmpty(this.baseFilterString)) {
			let filterBefore = this.orderFlatItems.filterDefinition.toString();
			if (_util.isEmpty(filterBefore) || filterBefore.indexOf(this.baseFilterString) < 0) {
				let filter = this.baseFilterString
					+ (this.preFilterString ? ' and ' + this.preFilterString : '');

				if (!_util.isEmpty(filterBefore)) {
					filter += ' and ' + filterBefore;
				}
				this.orderFlatItems.filterDefinition = filter;
			}
		}
	}

	public _getVisibleColumns(): any[] {
		return this.columns.filter(c => c.visible);
	}

	public refreshTable() {
		this.orderFlatItems.load();
	}

	public barCodesFilter(barcodes: string[]) {
		let filter = '(';
		for (let id of barcodes) {
			if (id !== '') {
				if (id !== barcodes[0]) {
					filter += ' or ';
				}
				filter += `itemId eq ${id}`;
			}
		}
		filter += ')';

		this.preFilterString = filter;
		this._setPreFilter(filter, this.baseFilterString + ` and `  + this.preFilterString, true);
	}

	public showPendente(refresh = true) {
		let preFilter = `(status ne ${InternalStatus.Abgebrochen.valueOf()} and status ne ${InternalStatus.Abgeschlossen.valueOf()})`;
		this._setPreFilter(preFilter, this.baseFilterString + ` and `  + preFilter, refresh);
	}

	public showAll() {
		this._setPreFilter(null, this.baseFilterString, true);
	}

	private _setPreFilter(preFilter, filterDef, refresh:boolean) {
		if (this.flexGrid && this.flexGrid.filter) {
			this.flexGrid.filter.clear();
		}

		this.preFilterString = preFilter;
		this.orderFlatItems.filterDefinition = filterDef;

		if (refresh) {
			this.refreshTable();
		}

		this._storage.setItem(`${this._getSessionStoragePrefix()}preFilterString`, this.preFilterString);
	}

	public getCurrentColumns(): any[] {
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

		return cols.sort((a, b) => {
			if (a.index > b.index) {
				return 1;
			}

			if (a.index < b.index) {
				return -1;
			}

			return 0;
		});
	}

	public refreshHiddenVisibleColumns() {
		this.visibleColumns = this._getVisibleColumns();

		if (this.orderFlatItems) {
			this.orderFlatItems.fields = this.columns.filter(x => x.key !== 'unknown').map(x => x.key);
			this.orderFlatItems.refresh();
		}
	}

	public exportExcel() {
		const fileName = this.isEinsichtsGesuchListe ?
			this._txt.get('orderslist.excelListNameEinsichtsgesuch', 'einsichtsgesuche.xlsx') :
			this._txt.get('orderslist.excelListNameAuftraege', 'auftraege.xlsx');

		this.flexGrid.exportToExcelOData(fileName).subscribe(() => {
			// nothing
		}, (err) => {
			this._err.showError(err);
		});
	}

	public resetSorts() {
		this.orderFlatItems.sortDescriptions.clear();
		for (let sc of this._getInitialSortDescriptions()) {
			this.orderFlatItems.sortDescriptions.push(sc);
		}
		this.orderFlatItems.load();
	}

	public resetFilters() {
		this.preFilterString = this._storage.getItem<string>(`${this._getSessionStoragePrefix()}preFilterString`);
		this.baseFilterString = this.isEinsichtsGesuchListe ? '(orderingType eq 4)' : '(orderingType ne 4)';
		this.orderFlatItems.filterDefinition = this.baseFilterString;
		this.refreshTable();
	}

	public openDetail(id: number) {
		let item = this.orderFlatItems.items.find(i => i.itemId === id);
		this._dps.setCurrent(this.orderFlatItems, this.orderFlatItems.items.indexOf(item));

		if (this.isEinsichtsGesuchListe) {
			this._rtr.navigate([this._url.getEinsichtsgesucheUebersichtUrl() + '/' + id]);
		} else {
			this._rtr.navigate([this._url.getAuftragsuebersichtUrl() + '/' + id]);
		}
	}
}
