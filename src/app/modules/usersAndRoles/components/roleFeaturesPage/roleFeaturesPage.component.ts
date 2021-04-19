import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CmiGridComponent, TranslationService, Utilities as _util} from '@cmi/viaduc-web-core';
import {UrlService, AuthorizationService, ErrorService, UiService} from '../../../shared/services';
import {PagedResult} from '../../../shared/model/apiModels';
import {RoleService} from '../../services/role.service';
import {FlexGridFilter} from '@grapecity//wijmo.grid.filter';

@Component({
	selector: 'cmi-viaduc-roles-features-page',
	templateUrl: 'roleFeaturesPage.component.html',
	styleUrls: ['./roleFeaturesPage.component.less']
})
export class RoleFeaturesPageComponent implements OnInit {

	public loading: boolean;

	public crumbs: any[] = [];
	public list: PagedResult<any>;

	public allowEdit: boolean;

	public roleFeaturesList: Map<string, string[]> = new Map<string, string[]>();
	public roleFeaturesForSaveList: Map<string, string[]> = new Map<string, string[]>();

	@ViewChild('flexGrid', { static: false })
	public flexGrid: CmiGridComponent;

	@ViewChild('filter', { static: false })
	public filter: FlexGridFilter;

	constructor(private _authorization: AuthorizationService,
				private _roleService: RoleService,
				private _txt: TranslationService,
				private _url: UrlService,
				private _err: ErrorService,
				private _router: Router,
				private _route: ActivatedRoute,
				private _ui: UiService) {
	}

	public get txt(): TranslationService {
		return this._txt;
	}

	private _buildCrumbs(): void {
		let crumbs: any[] = this.crumbs = [];
		crumbs.push({iconClasses: 'glyphicon glyphicon-home', url: this._url.getHomeUrl()});
		crumbs.push({
			url: this._url.getNormalizedUrl('/benutzerundrollen'),
			label: this._txt.get('breadcrumb.usersAndRoles', 'Benutzer und Rollen')
		});
		crumbs.push({label: this._txt.get('breadcrumb.roles', 'Rollen')});
	}

	private _prepareResult(result: PagedResult<any>) {
		const columns = [];
		// Alle selektierten Features ermitteln
		for (let item of result.items) {
			let featureList = [];
			for (let feature of item.features) {
				featureList.push(feature.id);
			}
			this.roleFeaturesList.set(item.id.toString(), featureList);
			this.roleFeaturesForSaveList = this.roleFeaturesList;
		}

		// Alle Rollen Mappen
		_util.forEach(result.items, (applicationrole) => {
			columns.push({key: applicationrole.id.toString(), label: applicationrole.name, id: applicationrole.id});
		});

		// Rollen zu Benutzer-Rollen Mappen
		result['features'].forEach(feature => {
			_util.forEach(result.items, (applicationrole) => {
				feature[applicationrole.id.toString()] = (this.roleFeaturesList.get(applicationrole.id.toString()).indexOf(feature.id) >= 0);
			});
		});

		result.dynamicColumns = columns;

		this.list = result;
		this._buildCrumbs();
	}

	private async _loadList(): Promise<void> {
		this.loading = true;
		try {
			this._roleService.getRoleInfos().subscribe(
				res => {
					this._prepareResult(res);
					this.loading = false;
				},
				err => {
					this._err.showError(err);
					this.loading = false;
				}
			);
		} catch (err) {
			this._err.showError(err);
		}
	}

	public isChecked(featureId: string, roleId: string): boolean {
		if (!this.list || !this.roleFeaturesList) {
			return false;
		}

		return this.roleFeaturesList.get(roleId).indexOf(featureId) >= 0;
	}
	public onCheckboxClick(featureId: string, roleId: string): void {
		if (this.roleFeaturesForSaveList.has(roleId)) {
			let a = this.roleFeaturesForSaveList.get(roleId);
			let index = a.indexOf(featureId);
			if (index >= 0) {
				a.splice(index, 1);
			}else {
				a.push(featureId);
			}
		}
	}

	public editMode(): void {
		this.allowEdit = !this.allowEdit && this._authorization.hasRole(this._authorization.roles.APPO);
	}

	public saveGridChanges(): void {
		this.loading = true;
		this.allowEdit = false;
		this.roleFeaturesForSaveList.forEach((value: string[], key: string) => {
				this._roleService.setRoleFeatures(key, value).then(
					res => {
						this.loading = false;
						this._loadList();
						this._ui.showSuccess(this._txt.get('roleFeature.successfullySaved', 'Rollen-Funktionen-Matrix erfolgreich gespeichert'));
					},
					err => {
						this._err.showError(err);
					}
				);
		});
	}

	public cancelGridChanges(): void {
		this.ngOnInit();
	}

	public exportGrid(): void {
		let fileName = this.txt.get('role.benutzer.exportfilename', 'rollen-funktiononen.bar.ch.xlsx');

		this.flexGrid.exportToExcel(fileName).subscribe(() => {
			// nothing
		}, (err) => {
			this._err.showError(err);
		});
	}

	public ngOnInit(): void {
		this._buildCrumbs();
		this._route.params.subscribe(params => this._loadList());

		this.allowEdit = false;
	}

	public show(item: any): void {
		const id = item ? item.id : 'new';
		this._router.navigate([this._url.getNormalizedUrl('/benutzerundrollen/rollen') + '/' + id]);
	}
}
