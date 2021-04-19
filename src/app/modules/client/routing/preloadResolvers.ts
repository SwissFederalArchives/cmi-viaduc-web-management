import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import {PreloadService} from '@cmi/viaduc-web-core';
import {map, take} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Injectable()
export class PreloadedResolver implements Resolve<boolean> {
	constructor(private _preloadService: PreloadService) {
	}

	public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
		if (this._preloadService.isPreloaded) {
			return true;
		} else {
			return this._preloadService.preloaded.pipe(take(1)).pipe(map(res => {
				return true;
			}));
		}
	}
}
