import {NgModule} from '@angular/core';
import {ALL_COMPONENTS} from './components/_all';
import {ROUTES} from './routes';
import {RouterModule} from '@angular/router';
import {SharedModule} from '../shared';
import {ALL_SERVICES} from './services/_all';
import {CommonModule} from '@angular/common';

@NgModule({
	imports: [
		SharedModule,
		RouterModule.forChild(ROUTES),
		CommonModule
	],
	providers: [ ... ALL_SERVICES ],
	exports: [ ...ALL_COMPONENTS ],
	declarations: [ ...ALL_COMPONENTS ]
})
export class CollectionModule {
}
