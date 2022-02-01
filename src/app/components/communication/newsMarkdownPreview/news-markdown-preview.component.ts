import { Component, Input } from '@angular/core';

@Component({
	selector: 'cmi-news-markdown-preview',
	templateUrl: 'news-markdown-preview.component.html',
	styleUrls: ['./news-markdown-preview.component.less']
})

export class NewsMarkdownPreviewComponent {
	public hideComponent = true;
	public vorschauAnzeigen = false;

	@Input()
	public set news(val: string) {
		this._news = val;

		if (!val || val.trim().length === 0) {
			this.hideComponent = true;
		} else {
			this.hideComponent = false;
		}
	}
	public get news() {
		return this._news;
	}

	private _news: string;
}
