import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {ApplicationFeatureEnum, CmiGridComponent, TranslationService} from '@cmi/viaduc-web-core';
import {News, NewsForEditor} from '../../../modules/client/model';
import {NewsService} from '../../../modules/client/services';
import {AuthorizationService, ErrorService, UrlService} from '../../../modules/shared/services';
import {CollectionView} from '@grapecity/wijmo';
import {ToastrService} from 'ngx-toastr';

@Component({
	selector: 'cmi-news-management-page',
	templateUrl: 'newsManagementPage.component.html',
	styleUrls: ['./newsManagementPage.component.less']
})

export class NewsManagementPageComponent implements OnInit {
	public crumbs: any[] = [];
	public newsForEditor: CollectionView;

	@ViewChild('flexGrid', { static: true })
	public flexGrid: CmiGridComponent;

	constructor(private _newsService: NewsService,
				private _url: UrlService,
				private _err: ErrorService,
				private _toastr: ToastrService,
				private _txt: TranslationService,
				private _router: Router,
				private _aut: AuthorizationService) {
	}

	public ngOnInit(): void  {
		this._buildCrumbs();
		this._getAndStoreNews();
	}

	private _buildCrumbs(): void {
		let crumbs: any[] = this.crumbs = [];
		let communication = 'kommunikation';
		crumbs.push({ iconClasses: 'glyphicon glyphicon-home', url: this._url.getHomeUrl() });
		crumbs.push({ url: this._url.getNormalizedUrl(`/${communication}`), label: this._txt.get('breadcrumb.communication', 'Kommunikation') });
		crumbs.push({ url: this._url.getNormalizedUrl(`/${communication}/news`), label: this._txt.get('breadcrumb.news', 'News') });
	}

	public editNews(item: NewsForEditor):void {
		this._router.navigate([this._url.getNormalizedUrl('kommunikation/news/bearbeiten') + '/' + item.id]);
	}

	public addNews(): void {
		this._router.navigate([this._url.getNormalizedUrl('kommunikation/news/erfassen')]);
	}

	public refresh(item: NewsForEditor):void {
		item.transferValues();
	}

	public get deleteButtonDisabledText(): string {
		let disabled = 'disabled';

		if (!this.flexGrid) {
			return disabled;
		}

		return this.flexGrid.selectedItems.length > 0 ? null : disabled;
	}

	public deleteSelected():void {
		if (!this.flexGrid) {
			return;
		}

		let toDelete: string[] = this.flexGrid.selectedItems.map(n => n.id);
		if (toDelete.length === 0) {
			return;
		}

		this._newsService.deleteNews(toDelete).then((data) => {
			this._getAndStoreNews();
			this._toastr.success('Erfolgreich gelöscht');
		},
		(error) => {
			this._err.showError(error);
		});
	}

	private _getAndStoreNews(): void {
		this._newsService.getAllNewsForManagementClient().then((data: News[]) => {
				let news = [];
				for (let n of data) {
					news.push(new NewsForEditor(n));
				}
				this.newsForEditor = new CollectionView(news);
			},
			(error) => {
				this._err.showError(error);
			});
	}

	public get allowNewsBearbeiten(): boolean {
		return this._aut.hasApplicationFeature(ApplicationFeatureEnum.AdministrationNewsBearbeiten);
	}
}
