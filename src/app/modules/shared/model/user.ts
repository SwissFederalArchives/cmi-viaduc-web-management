import {AblieferndeStelle} from './ablieferndeStelle';

export class User {
	public id: string;
	public familyName: string;
	public firstName: string;
	public organization: string;
	public street: string;
	public streetAttachment: string;
	public zipCode: string;
	public town: string;
	public countryCode: string;
	public emailAddress: string;
	public phoneNumber: string;
	public skypeName: string;
	public setting: any;
	public tokens: string[];
	public ablieferndeStelleList: AblieferndeStelle[];
}
