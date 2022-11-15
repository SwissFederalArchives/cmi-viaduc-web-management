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
	public mobileNumber: string;
	public setting: any;
	public tokens: string[];
	public ablieferndeStelleList: AblieferndeStelle[];
	public rolePublicClient: string;
	public birthday: string;
	public displayName: string;
	public userExtId: string;
	public language: string;
	public legalAgreementConset: boolean;
	public fabasoftDossier: string;
	public createdOn: Date;
	public createdBy: string;
	public modifiedOn: Date;
	public modifiedBy: string;
	public downloadLimitDisabledUntil: Date;
	public digitalisierungsbeschraenkung: Date;
}
