import {RoleFeaturesPageComponent} from './components/roleFeaturesPage/roleFeaturesPage.component';
import {UserSettingsResolver} from '../client/routing/userSettingsResolver';
import {UserRolesDetailPageComponent} from './components/userRolesDetailPage/userRolesDetailPage.component';
import {UserRolesPageComponent} from './components/userRolesPage/userRolesPage.component';

export const ROUTES: any = [
	{
		path: '',
		redirectTo: 'benutzer',
		pathMatch: 'full'
	},
	{
		path: 'benutzer',
		_localize: {'fr': 'users', 'it': 'users', 'en': 'users'},
		component: UserRolesPageComponent
	},
	{
		path: 'benutzer/:id',
		_localize: {'fr': 'user', 'it': 'user', 'en': 'user'},
		component: UserRolesDetailPageComponent
	},
	{
		path: 'rollen',
		_localize: {'fr': 'roles', 'it': 'roles', 'en': 'roles'},
		component: RoleFeaturesPageComponent,
		resolve: {userLoaded: UserSettingsResolver}
	}
];
