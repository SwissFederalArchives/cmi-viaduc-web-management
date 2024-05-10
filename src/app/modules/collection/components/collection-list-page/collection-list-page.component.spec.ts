import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {CollectionListPageComponent} from './collection-list-page.component';
import {ClientContext, ClientModel, CollectionListItemDto, ConfigService, CoreModule, TranslationService, UserUiSettings} from '@cmi/viaduc-web-core';
import {AuthorizationService, ErrorService, SharedModule, UiService, UrlService, User, UserService} from '../../../shared';
import {CollectionService} from '../../services';
import {Router} from '@angular/router';
import {MockUserSettings, ToastrTestingModule} from './mocks';
import {Observable} from 'rxjs';
import * as moment from 'moment';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('CollectionListPageComponent', () => {
	let sut: CollectionListPageComponent;
	let fixture: ComponentFixture<CollectionListPageComponent>;
	let collectionService = <CollectionService> {
		getAll(): Observable<CollectionListItemDto[] | null> {
			let result:  Observable<CollectionListItemDto[]>;
			let collectionList: CollectionListItemDto[] = new Array(CollectionListItemDto[3]);
			collectionList[0] = CollectionListItemDto.fromJS(
				{
					collectionId: 6,
					validFrom: moment().startOf('day').toDate(),
					validTo: moment().startOf('day').add(30, 'days').toDate(),
					createdOn: moment().startOf('day').toDate(),
					modifiedOn: moment().startOf('day').toDate(),
					collectionTypeId: 0
				});
			collectionList[1] = CollectionListItemDto.fromJS({
				collectionId:1,
				validFrom: moment(Date.now()).toDate(),
				validTo:  moment(Date.now()).toDate(),
				createdOn: moment(Date.now()).toDate(),
				modifiedOn: moment(Date.now()).toDate(),
				collectionTypeId: 0,
				descriptionShort: 'Short short',
				description: 'Test kind'	});

			collectionList[2] = CollectionListItemDto.fromJS({
				collectionId: 4,
				validFrom: moment(Date.now()).toDate(),
				validTo: moment(Date.now()).toDate(),
				createdOn: moment(Date.now()).toDate(),
				modifiedOn: moment(Date.now()).toDate(),
				collectionTypeId: 0,
				descriptionShort: 'Short short',
				description: 'Hallos',
				childCollections: '1'
			});
			result = new Observable(observer => {
				// pushing values
				observer.next(collectionList);
				// complete stream
				observer.complete();
			});
			return  result;
		},
		batchDelete(ids: number[]): Observable<any> {
			let result = new Observable(observer => {
				// pushing values
				observer.next(true);
				// complete stream
				observer.complete();
			});
			return  result;
		},
		delete(id: number): Observable<any> {
			let result = new Observable(observer => {
				// pushing values
				observer.next(true);
				// complete stream
				observer.complete();
			});
			return  result;
		},
		getImageURL(collectionId: number): string {
			return '/api/Collections/GetImage/' + collectionId + '?usePrecalculatedThumbnail=true';
		}
	};

	beforeEach(  waitForAsync(async() => {
		let defaultLanguage = 'en';
		let clientModel = <ClientModel>{};
		let clientContext = <ClientContext>{defaultLanguage: defaultLanguage, language: 'de'};
		let txt =  <TranslationService>{
			get(key: string, defaultValue?: string, ...args): string {
				return key;
			}
		};
		let configService = <ConfigService>{
			getUserSettings(): UserUiSettings {
				return new MockUserSettings();
			},
			getSetting(key: string, defaultValue?: any): any {
				if (key === 'collections.listColumns') {
					let settings = new MockUserSettings();
					return settings.collectionSettings.columns;
				} else {
					return key;
				}
			}
		};
		let authorizationService = <AuthorizationService>{};
		let errorService = <ErrorService>{};
		let url = <UrlService>{
			getHomeUrl(): string {
				return 'www.google.de';
			}
		};
		let userService = <UserService>{
			getUser(): Promise<User> {
				return Promise.resolve(<User>{id: '123', emailAddress: 'darth.vader@cmiag.ch'});
			},
			updateUserSettings(settings: any) {
			},
			getUserSettings(): Promise<any> {
				return Promise.resolve( new MockUserSettings());
			}
		};
		let router = <Router>{};

		await TestBed.configureTestingModule({
			imports:[SharedModule.forRoot(), CoreModule.forRoot(), ToastrTestingModule],
			declarations: [CollectionListPageComponent],
			schemas: [NO_ERRORS_SCHEMA],
			providers: [
				{provide: CollectionService, useValue: collectionService },
				{provide: TranslationService, useValue: txt },
				{provide: UrlService, useValue: url},
				{provide: UiService},
				{provide: ErrorService, useValue: errorService},
				{provide: ConfigService, useValue: configService},
				{provide: UserService, useValue: userService},
				{provide: Router, useValue: router},
				{provide: ClientModel, useValue: clientModel},
				{provide: ClientContext, useValue: clientContext},
				{provide: AuthorizationService, useValue: authorizationService}
			]
		}).compileComponents();
	}));

	beforeEach(waitForAsync(async() => {
		fixture = TestBed.createComponent(CollectionListPageComponent);
		sut = fixture.componentInstance;
		sut.ngOnInit();
		sut.showDeleteModal = false;
		await fixture.whenStable();
	}));

	it('should create a new  instance', (() => {
			expect(sut).toBeTruthy();
	}));

	it('should get data ', (() => {
		expect(sut.collections).toBeTruthy();
		expect(sut.collections.items.length === 3).toBeTruthy();
	}));

	it('delete okay ', () => {
		sut.flexGrid.addOrRemoveItemFromSelection(sut.collections.items[1], 'add');
		sut.toggleDeleteModal();
		expect(sut.showDeleteModal).toBeFalse();
	});

	it('delete not okay ', () => {
		let before = sut.showDeleteModal;
		sut.flexGrid.addOrRemoveItemFromSelection(sut.collections.items[2], 'add');
		sut.toggleDeleteModal();
		expect(sut.showDeleteModal).toBe(before);
	});

	it('delete 2 Items not okay ', () => {
		let before = sut.showDeleteModal;
		sut.flexGrid.addOrRemoveItemFromSelection(sut.collections.items[1], 'add');
		sut.flexGrid.addOrRemoveItemFromSelection(sut.collections.items[2], 'add');
		sut.toggleDeleteModal();
		expect(sut.showDeleteModal).toBe(before);
	});
});
