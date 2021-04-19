import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate} from '@angular/router';
import {ContextService} from '../services/context.service';
import {ClientContext, Utilities as _util} from '@cmi/viaduc-web-core';

@Injectable()
export class DefaultContextGuard implements CanActivate {

	private _languageTester: RegExp = /^(de|fr|it|en)$/;

	constructor(protected context: ClientContext, protected contextService: ContextService) {
	}

	public async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
		let language: string = route.params['lang'];
		if (!_util.isEmpty(language) && !this._languageTester.test(language)) {
			language = undefined;
		}
		const rte1stPart = route.root.children.length > 0 ? route.root.children[0] : route;
		if (!language && rte1stPart.url && rte1stPart.url.length > 0 && this._languageTester.test(rte1stPart.url[0].path)) {
			language = rte1stPart.url[0].path;
		}
		language = language || this.context.language;
		if (language !== this.context.language) {
			await this.contextService.updateLanguage(language);
		}

		return true;
	}

}
