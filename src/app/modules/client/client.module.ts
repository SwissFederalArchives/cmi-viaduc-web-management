import {ModuleWithProviders, NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {HttpClientModule} from '@angular/common/http';
import {ALL_COMPONENTS} from './components/_all';
import {ALL_DIRECTIVES} from './directives/_all';
import {ALL_SERVICES} from './services/_all';
import {ALL_GUARDS, ALL_RESOLVERS} from './routing/_all';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AdminModel} from './model';
import {SharedModule} from '../shared';

export function AdminModelFactory() {
	return new AdminModel();
}

@NgModule({
	declarations: [
		...ALL_COMPONENTS,
		...ALL_DIRECTIVES,
	],
	exports: [
		...ALL_COMPONENTS,
		...ALL_DIRECTIVES,
		RouterModule,
		BrowserAnimationsModule
	],
	imports: [
		SharedModule,
		RouterModule,
		HttpClientModule,
		BrowserAnimationsModule,
	]
})

export class ClientModule {

	constructor() {
	}

	public static forRoot(): ModuleWithProviders<ClientModule> {
		return {
			ngModule: ClientModule,
			providers: [
				...ALL_SERVICES,
				...ALL_GUARDS,
				...ALL_RESOLVERS,
				{ provide: AdminModel, useFactory: AdminModelFactory }
			]
		};
	}
}
