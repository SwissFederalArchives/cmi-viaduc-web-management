import {Component, Input} from '@angular/core';
import {Entity} from '@cmi/viaduc-web-core';

@Component({
	selector: 'cmi-archivplan-context',
	templateUrl: 'archivplanKontext.component.html',
	styleUrls: ['./archivplanKontext.component.less']
})
export class ArchivplanKontextComponent {
	@Input()
	public items: Entity[];

	public inset: number = 1;

	constructor() {
	}
}
