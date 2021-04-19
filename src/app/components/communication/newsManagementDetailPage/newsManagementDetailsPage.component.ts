import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslationService} from '@cmi/viaduc-web-core';
import {HttpErrorResponse} from '@angular/common/http';
import {News} from '../../../modules/client/model';
import {NewsService} from '../../../modules/client/services';
import {UrlService} from '../../../modules/shared/services';

@Component({
	selector: 'cmi-news-management-details-page',
	templateUrl: 'newsManagementDetailsPage.component.html'
})

export class NewsManagementDetailsPageComponent implements OnInit {
	public crumbs: any[] = [];
	public id: string;
	public pageHeader: string;
	public news: News;
	public errors: string[];

	private _mode: Mode;
	private _newsHasBeenChanged: boolean;

	constructor(private _newsService: NewsService,
				private _txt: TranslationService,
				private _url: UrlService,
				private _route: ActivatedRoute,
				private _router: Router) {
	}

	public ngOnInit(): void {
		this._route.params.subscribe(params => this._checkAndProcessId(params['id']));
		this._buildCrumbs();
	}

	public processChanges(): void {
		if (!this._allFieldsAreSet()) {
			this._clearAndAddError(this._txt.get('newsManagementDetailsPage.fieldsRequireValues' , 'Es sind nicht alle Felder ausgefüllt'));
			return;
		}
		if (!this._timeFormatCorrect()) {
			this._clearAndAddError(this._txt.get('newsManagementDetailsPage.timeFieldsRequireFormating' , 'Die Felder Gültig von und Gültig bis müssen im Format DD.MM.JJJJ HH:mm sein'));
			return;
		}
		this.errors = [];
		let promise: Promise<any> = this._newsService.insertOrUpdateNews(this.news);

		promise.then((data) => {
				this._goToNews();
			},
			(error: HttpErrorResponse) => {
				if (error.error instanceof Error) {
					this._clearAndAddError(error.error.message);
				} else {
					this._clearAndAddError(error.error.Message);
				}
			});
	}

	public cancel(): void {
		this._goToNews();
	}

	public get hasErrors(): boolean {
		return this.errors && this.errors.length > 0;
	}

	private _clearAndAddError(error: string): void {
		this.errors = [];
		this.errors.push(error);
	}

	private _setNewsHasBeenChanged(): void {
		if (this._newsHasBeenChanged) {
			return;
		}

		this._newsHasBeenChanged = true;
	}

	private _allFieldsAreSet(): boolean {
		if (!this.news) {
			return false;
		}

		if (!this.news.fromDate) {
			return false;
		}

		if (!this.news.toDate) {
			return false;
		}

		if (!this.news.de) {
			return false;
		}

		if (!this.news.deHeader) {
			return false;
		}

		if (!this.news.en) {
			return false;
		}

		if (!this.news.enHeader) {
			return false;
		}

		if (!this.news.fr) {
			return false;
		}

		if (!this.news.frHeader) {
			return false;
		}

		if (!this.news.it) {
			return false;
		}

		if (!this.news.itHeader) {
			return false;
		}

		return true;
	}

	private _goToNews(): void {
		this._router.navigate([this._url.getNormalizedUrl('kommunikation/news')]);
	}

	public textChanged(): void {
		this._setNewsHasBeenChanged();
	}

	private _buildCrumbs(): void {
		let crumbs: any[] = this.crumbs = [];
		let communication = 'kommunikation';
		let news = 'news';

		crumbs.push({iconClasses: 'glyphicon glyphicon-home', url: this._url.getHomeUrl()});
		crumbs.push({
			url: this._url.getNormalizedUrl(`/${communication}`),
			label: this._txt.get('breadcrumb.communication', 'Kommunikation')
		});
		crumbs.push({
			url: this._url.getNormalizedUrl(`/${communication}/${news}`),
			label: this._txt.get('breadcrumb.news', 'News')
		});

		if (this._mode === Mode.Add) {
			crumbs.push({
				url: this._url.getNormalizedUrl(`/${communication}/${news}/erfassen`),
				label: this._txt.get('breadcrumb.create', 'Erfassen')
			});
		}

		if (this._mode === Mode.Edit) {
			crumbs.push({
				url: this._url.getNormalizedUrl(`/${communication}/${news}/bearbeiten/${this.id}`),
				label: this._txt.get('breadcrumb.edit', 'Bearbeiten')
			});
		}
	}

	private async _checkAndProcessId(id: string): Promise<void> {
		this.id = id;

		this._mode = this.id ? Mode.Edit : Mode.Add;

		if (this._mode === Mode.Add) {
			this.news = new News();
			this.pageHeader = this._txt.get('communication.createNews', 'News hinzufügen');
			return;
		}

		this.pageHeader = this._txt.get('communication.editNews', 'News bearbeiten');

		let promise: Promise<any> = this._newsService.getSingleNews(this.id);
		promise.then((data) => {
				this.news = data;
				this._newsHasBeenChanged = false;
			},
			(error) => {
				console.log(error);
			});
	}

	private _timeFormatCorrect(): boolean {
		let regex = new RegExp('(([0-2][0-9]|30|31).(01|03|05|07|08|10|12)|([0-2][0-9]|30).(04|06|09|11)|(([0-2][0-9]).02)).[0-9]{4} ([0-1][0-9]|20|21|22|23):[0-5][0-9]');
		let matchFrom = regex.exec(this.news.fromDate);
		let matchTo = regex.exec(this.news.toDate);
		return matchFrom !== null && matchTo !== null;
	}
}

export enum Mode {
	Add,
	Edit,
}
