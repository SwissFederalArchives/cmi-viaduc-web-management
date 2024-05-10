import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {CollectionDetailPageComponent} from './collection-detail-page.component';
import {CollectionService} from '../../services';
import {ApplicationFeatureEnum, ClientContext, CollectionDto, CollectionListItemDto, CoreModule, TranslationService} from '@cmi/viaduc-web-core';
import {AuthorizationService, ErrorService, SharedModule, UrlService} from '../../../shared';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {FormBuilder} from '@angular/forms';
import {Observable, of} from 'rxjs';
// import {By} from '@angular/platform-browser';
import {MockUserSettingsParamMap} from './mocks';
import * as moment from 'moment';
import {By} from '@angular/platform-browser';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('CollectionDetail', () => {
	// const mockFileReader =  new MockFileReader();
	let defaultLanguage = 'en';
	let clientContext = <ClientContext>{defaultLanguage: defaultLanguage, language: 'de'};
	let fixture: ComponentFixture<CollectionDetailPageComponent>;
	let sut: CollectionDetailPageComponent;
	let collectionService = <CollectionService>{
		getAllowedParents(currentItemId: number): Observable<any[] | null> {
			let collectionList: CollectionListItemDto[] = new Array(CollectionListItemDto[1]);
			collectionList[0] = CollectionListItemDto.fromJS(
				{
					collectionId: 1,
					validFrom:'21.11.2021',
					validTo:  '21.12.2021',
					createdOn: '21.11.2021',
					modifiedOn:'21.12.2021',
					collectionTypeId: 1
				});
			return  of(collectionList);
		},
		get(id: number): Observable<CollectionDto | null> {

			let child = CollectionDto.fromJS({
				title: 'Test Sammlung',
				collectionId:3,
				validFrom: moment(Date.now()).toDate(),
				validTo:  moment(Date.now()).toDate(),
				createdOn: moment(Date.now()).toDate(),
				modifiedOn: moment(Date.now()).toDate(),
				collectionTypeId: 0,
				descriptionShort: 'Short short',
				description: 'Test kind',
				image: '',
				imageMimeType: '',
				imageAltText: ''
			});

			let collection = CollectionDto.fromJS({
				title: 'Weitere Sammlung',
				collectionId: 1,
				validFrom: moment(Date.now()).toDate(),
				validTo: moment(Date.now()).toDate(),
				createdOn: moment(Date.now()).toDate(),
				modifiedOn: moment(Date.now()).toDate(),
				collectionTypeId: 0,
				descriptionShort: 'Short short',
				description: 'Hallos',
				childCollections: [{child}],
				image: '',
				imageMimeType: '',
				imageAltText: ''
			});
			return of(collection);
		}
	};
	let translationService = <TranslationService>{
		get(key: string, defaultValue?: string, ...args): string {
			if (defaultValue) {
				return defaultValue;
			} else {
				return key;
			}
		},
		translate(text: string, key?: string, ...args): string {
			return text;
		}
	};
	let toastrService = <ToastrService>{};
	let authorizationService = <AuthorizationService>{
		hasApplicationFeature(identifier: ApplicationFeatureEnum): boolean {
			return true;
		}
	};
	let urlService = <UrlService>{
		getNormalizedUrl(url: string): string {
			return url;
		},
		getHomeUrl(): string {
			return 'www.google.de';
		},
		localizeUrl(lang: string, url: string): string {
			return url;
		}
	};
	let activatedRoute = <ActivatedRoute>{
		get paramMap(): Observable<ParamMap> {
			return of ( new MockUserSettingsParamMap()).pipe();
		}
	};
	let router = <Router>{};
	let errorService = <ErrorService>{};

	beforeEach(waitForAsync(async () => {
		await TestBed.configureTestingModule({
			imports: [CoreModule.forRoot(), SharedModule.forRoot()],
			declarations: [CollectionDetailPageComponent],
			schemas: [NO_ERRORS_SCHEMA],
			providers: [
				{provide: CollectionService, useValue: collectionService},
				{provide: UrlService, useValue: urlService},
				{provide: FormBuilder, useValue: new FormBuilder()},
				{provide: ClientContext, useValue: clientContext},
				{provide: ErrorService, useValue: errorService},
				{provide: ActivatedRoute, useValue: activatedRoute},
				{provide: ToastrService, useValue: toastrService},
				{provide: AuthorizationService, useValue: authorizationService},
				{provide: TranslationService, useValue: translationService },
				{provide: Router, useValue: router},
			]
		}).compileComponents();
	}));

	beforeEach(waitForAsync ( async () => {
		fixture = TestBed.createComponent(CollectionDetailPageComponent);
		sut = fixture.componentInstance;
		await sut.ngOnInit();

		await fixture.whenStable();
	}));

	function setDataWithoutLink() {
		sut.myForm.controls['title'].setValue('Test valid');
		sut.myForm.controls['collectionId'].setValue(0);
		sut.myForm.controls['language'].setValue('de');
		sut.myForm.controls['descriptionShort'].setValue('Description short');
		sut.myForm.controls['description'].setValue('description');
		sut.myForm.controls['collectionTypeId'].setValue(1);
	}

	function setVaildData() {
		setDataWithoutLink();
		sut.myForm.controls['link'].setValue('www.evelix.ch');
	}

	it('should create an instance',  waitForAsync(() => {
		fixture.autoDetectChanges(true);
		fixture.whenStable().then(() => {
			setVaildData();
			expect(sut).toBeTruthy();
			expect(sut.myForm).toBeTruthy();
			expect(sut.myForm.valid).toBeTruthy();
		});
	}));

	it('change collectionType to Themenblock and Link is not required and change back',  ( () => {
		fixture.autoDetectChanges(true);
		fixture.whenStable().then(() => {
			setDataWithoutLink();
			const collectionType =  fixture.debugElement.query(By.css('[name="collectionTypeId"]')).nativeElement;
			collectionType.selectedIndex  = 0;
			collectionType.dispatchEvent(new Event('change'));
			expect(sut.myForm.valid).toBeFalsy();

			collectionType.selectedIndex  = 1;
			sut.collectionTypeChanged();
			collectionType.dispatchEvent(new Event('change'));
			expect(sut.myForm.valid).toBeTruthy();
			collectionType.selectedIndex  = 0;
			collectionType.dispatchEvent(new Event('change'));
			sut.myForm.controls['link'].setValue('www.evelix.ch');
			expect(sut.myForm.valid).toBeTruthy();
		});
	}));

	it('click deleteImage Button should delete Image ', async () => {
		fixture.autoDetectChanges(true);

		await fixture.whenStable().then(() => {
			setVaildData();
			sut.collectionTypeChanged();
			sut.myForm.controls['image'].setValue('image/gif, 12346HasdAFfesafjaäfä<flk<sdfknweanf');
			sut.myForm.controls['imageMimeType'].setValue('image/gif');
			sut.myForm.controls['imageAltText'].setValue('Alternativtext zum Bild');
			fixture.detectChanges();
			const button = fixture.debugElement.query(By.css('[name="deleteImage"]')).nativeElement;
			button.click();

			expect(sut.myForm.controls['image'].value).toBeNull();
			expect(sut.myForm.controls['imageMimeType'].value).toBeNull();
			expect(sut.myForm.controls['imageAltText'].value).toBeNull();
			expect(sut.myForm.valid).toBeTruthy();
		});
	});

	it('should the collectionTypeId was set to 1  link desappears', () => {
		fixture.autoDetectChanges(true);
		fixture.whenStable().then(
			() => {
				setVaildData();
				const linkElement = fixture.debugElement.query(By.css('[name="link"]')).nativeElement;
				expect(linkElement).toBeTruthy();
				const collectionType = fixture.debugElement.query(By.css('[name="collectionTypeId"]')).nativeElement;
				collectionType.selectedIndex = 1;
				collectionType.dispatchEvent(new Event('change'));
			//	const link = fixture.debugElement.query(By.css('[name="link"]'));
			//	expect(link=== undefined).toBeTruthy();

			});


	});
});
