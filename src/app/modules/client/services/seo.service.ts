import {Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {TranslationService, Utilities as _util} from '@cmi/viaduc-web-core';

declare const jQuery: any;

@Injectable()
export class SeoService {

	private _html: any;
	private _head: any;

	constructor(private _title: Title, private _txt: TranslationService) {
		this._html = jQuery('html');
		this._head = this._html.find('head');
	}

	public getTitle(): string {
		return this._title.getTitle();
	}

	public setTitle(title: string) {
		this._title.setTitle(title);
	}

	public getElement(tag: string, attribute: string, value: string): any {
		return this._assertElement(tag, attribute, value);
	}

	public getMeta(name: string): string {
		return this._assertMeta(name).attr('content');
	}

	public setMeta(name: string, content: string) {
		this._assertMeta(name).attr('content', content);
	}

	private _assertElement(tag: string, attribute: string, attrValue: string): any {
		let elem: any;
		elem = this._head.find(tag + '[' + attribute + '=' + attrValue + ']');
		if (_util.isEmpty(elem)) {
			elem = jQuery('<' + tag + '></' + tag + '>').attr(attribute, attrValue);
			this._head.append(elem);
		}
		return elem;
	}

	private _assertMeta(name: string): any {
		return this._assertElement('meta', 'name', name);
	}

	public setLanguageInfo(language: string): void {
		try {
			this._html.attr('lang', language);
			this.setMeta('language', language);
		} catch (ex) {
			console.error(ex);
		}
	}

	// eslint-disable-next-line
	public updatePageInfo(url: string): void {
		const title = this._txt.get('header.title', 'Management-Client des Online-Zugangs');
		const description = this._txt.get('page.description', 'recherche.admin.ch');

		try {
			this.setTitle(title);
			this.setMeta('description', description);
		} catch (ex) {
			console.error(ex);
		}
	}
}
