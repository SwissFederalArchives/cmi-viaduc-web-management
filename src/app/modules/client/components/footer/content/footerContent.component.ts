import {AfterViewInit, Component, ElementRef, OnInit} from '@angular/core';
import {ClientContext, Utilities as _util} from '@cmi/viaduc-web-core';

@Component({
	selector: 'cmi-viaduc-footer-content',
	templateUrl: 'footerContent.component.html'
})
export class FooterContentComponent implements OnInit, AfterViewInit {
	private _elem: any;

	constructor(private _context: ClientContext,
				private _elemRef: ElementRef) {
		this._elem = this._elemRef.nativeElement;
	}

	public ngOnInit(): void {
	}

	public ngAfterViewInit(): void {
		_util.initJQForElement(this._elem);
	}

	public get language(): string {
		return this._context.language;
	}

}
