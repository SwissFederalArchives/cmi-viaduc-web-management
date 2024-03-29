import {Component, OnDestroy, OnInit} from '@angular/core';
import {ContextService} from '../../services';

@Component({
	selector: 'cmi-viaduc-header',
	templateUrl: 'header.component.html'
})
export class HeaderComponent implements OnInit, OnDestroy {

	private _contextSubscription: any = null;
	public reload = false;

	private _language: string = null;

	constructor(private _contextService: ContextService) {

	}

	public ngOnInit(): void {
		this._contextSubscription = this._contextService.context.subscribe((ctx) => {
			if (ctx.language !== this._language) {
				// eslint-disable-next-line
				const _component = this;
				this._language = ctx.language;
				this.reload = true;
				window.setTimeout(function () {
					_component.reload = false;
				}, 0);
			}
		});
	}

	public ngOnDestroy(): void {
		if (this._contextSubscription) {
			this._contextSubscription.unsubscribe();
		}
		this._contextSubscription = null;
	}

}
