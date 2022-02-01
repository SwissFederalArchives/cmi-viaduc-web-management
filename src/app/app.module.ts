import {NgModule, APP_INITIALIZER } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {Router, RouterModule} from '@angular/router';
import {RootComponent} from './components/root/root.component';
import {ALL_COMPONENTS} from './components/_all';
import {ROUTES, initRoutes} from './routes';
import {SharedModule} from './modules/shared';
import {ClientModule} from './modules/client';
import {CoreModule} from '@cmi/viaduc-web-core';
import {ToastrModule} from 'ngx-toastr';
import {AuthenticationService} from './modules/client/services';
import {MarkdownModule} from 'ngx-markdown';
import {FormsModule} from '@angular/forms';

export const toastrOptions = {
	timeOut: 3000,
	positionClass: 'toast-top-center', // PVW-92
	preventDuplicates: true
};

initRoutes(ROUTES);

export function tryActivateExistingSession(authentication: AuthenticationService) {
	let x = () => authentication.tryActivateExistingSession();
	return x;
}

@NgModule({
	imports: [
		BrowserModule,
		FormsModule,
		CoreModule.forRoot(),
		SharedModule.forRoot(),
		ClientModule.forRoot(),
		RouterModule.forRoot(ROUTES, { useHash: true, relativeLinkResolution: 'legacy' }),
		ToastrModule.forRoot(toastrOptions),
		MarkdownModule.forRoot()
	],
	providers: [
		{ provide: APP_INITIALIZER, useFactory: tryActivateExistingSession, deps: [AuthenticationService], multi: true },
	],
	bootstrap: [RootComponent],
	declarations: [
		...ALL_COMPONENTS
	]
})
export class AppModule {
	constructor(_router: Router) {
		_router.resetConfig(ROUTES);
	}
}
