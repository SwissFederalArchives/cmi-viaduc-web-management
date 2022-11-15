// import {NgModule, APP_INITIALIZER } from '@angular/core';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {Router, RouterModule} from '@angular/router';
import {RootComponent} from './components/root/root.component';
import {ALL_COMPONENTS} from './components/_all';
import {ROUTES, initRoutes} from './routes';
import {SharedModule} from './modules/shared';
import {ClientModule} from './modules/client';
import {ClientContext, CoreModule} from '@cmi/viaduc-web-core';
import {ToastrModule} from 'ngx-toastr';
import {AuthenticationService} from './modules/client/services';
import {MarkdownModule} from 'ngx-markdown';
import {FormsModule} from '@angular/forms';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {AuthInterceptor} from './interceptors/authInterceptor';

export const toastrOptions = {
	timeOut: 3000,
	positionClass: 'toast-top-center', // PVW-92
	preventDuplicates: true
};

initRoutes(ROUTES);

export function tryActivateExistingSession(authentication: AuthenticationService) {
	let x = () => authentication.activateSession();
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
		{
		provide: HTTP_INTERCEPTORS,
		useFactory: function(auth: AuthenticationService, context: ClientContext) {
			return new AuthInterceptor(auth, context);
		},
		multi: true,
		deps: [AuthenticationService, ClientContext]
		}
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
