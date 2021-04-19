import {AuthorizationService} from './authorization.service';
import {UrlService} from './url.service';
import {AblieferndeStelleService} from './ablieferndeStelle.service';
import {UiService} from './ui.service';
import {UserService} from './user.service';
import {DetailPagingService} from './detailPaging.service';
import {ErrorService} from './error.service';
import {FileDownloadService} from './fileDownload.service';

export const ALL_SERVICES = [
	AuthorizationService,
	UrlService,
	AblieferndeStelleService,
	UiService,
	DetailPagingService,
	UserService,
	ErrorService,
	FileDownloadService
];
