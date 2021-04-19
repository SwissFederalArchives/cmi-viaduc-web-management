import {UserUiSettings} from '@cmi/viaduc-web-core';

export interface ManagementUserSettings extends UserUiSettings {
	orderSettings: OrderUserSettings;
	digipoolSettings: DigipoolUserSettings;
	userListSettings: UserListUserSettings;
	einsichtsGesuchSettings: EinsichtsgesuchUserSettings;
	ablieferndeStelleSettings: AblieferndeStelleSettings;
}

export interface OrderUserSettings {
	columns: any;
}

export interface EinsichtsgesuchUserSettings {
	columns: any;
}

export interface DigipoolUserSettings {
	columns: any;
}

export interface UserListUserSettings {
	columns: any;
}

export interface AblieferndeStelleSettings {
	columns: any;
}
