import {Component, Input} from '@angular/core';
import {ArchiveRecordContextItem} from '@cmi/viaduc-web-core';

@Component({
	selector: 'cmi-archivplan-context',
	templateUrl: 'archivplanKontext.component.html',
	styleUrls: ['./archivplanKontext.component.less']
})
export class ArchivplanKontextComponent {
	@Input()
	public items: ArchiveRecordContextItem[];

	public inset: number = 1;

	constructor() {
	}
}
