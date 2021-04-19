import {OrdersListPageComponent, OrdersDetailPageComponent} from './components';
import {OrdersEinsichtListPageComponent, OrdersEinsichtDetailPageComponent} from './components';
import {DigipoolListPageComponent} from './components';
import {ApplicationFeatureGuard} from '../client';
import {ApplicationFeatureEnum} from '@cmi/viaduc-web-core';

export const ROUTES: any = [
	{
		path: 'auftraege',
		component: OrdersListPageComponent,
		canActivate: [ApplicationFeatureGuard],
		data: { applicationFeature: [ApplicationFeatureEnum.AuftragsuebersichtAuftraegeView] },
	},
	{
		path: 'auftraege/:id',
		component: OrdersDetailPageComponent,
		canActivate: [ApplicationFeatureGuard],
		data: { applicationFeature: [ApplicationFeatureEnum.AuftragsuebersichtAuftraegeView] },
	},
	{
		path: 'einsichtsgesuche',
		component: OrdersEinsichtListPageComponent,
		canActivate: [ApplicationFeatureGuard],
		data: { applicationFeature: [ApplicationFeatureEnum.AuftragsuebersichtEinsichtsgesucheView] },
	},
	{
		path: 'einsichtsgesuche/:id',
		component: OrdersEinsichtDetailPageComponent,
		canActivate: [ApplicationFeatureGuard],
		data: { applicationFeature: [ApplicationFeatureEnum.AuftragsuebersichtEinsichtsgesucheView] },
	},
	{
		path: 'digitalisierungsauftraege',
		component: DigipoolListPageComponent,
		canActivate: [ApplicationFeatureGuard],
		data: { applicationFeature: [ApplicationFeatureEnum.AuftragsuebersichtDigipoolView] }
	}
];
