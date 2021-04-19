import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApproveStatus, EntityDecoratorService} from '@cmi/viaduc-web-core';
import {OrderService} from '../../../services';
import {ToastrService} from 'ngx-toastr';
import {ErrorService} from '../../../../shared/services';
import * as moment from 'moment';

@Component({
	selector: 'cmi-viaduc-freigabekontrolle-modal',
	templateUrl: 'freigabeKontrolleModal.component.html',
	styleUrls: ['./freigabeKontrolleModal.component.less']
})
export class FreigabeKontrolleModalComponent implements OnInit {

	@Input()
	public ids: number[] = [];
	@Input()
	public datumBewilligung: string | Date;
	@Input()
	public interneBemerkung: string;
	@Input()
	public set open(val: boolean) {
		this._open = val;
		this.openChange.emit(val);
	}
	public get open(): boolean {
		return this._open;
	}

	@Output()
	public openChange: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output()
	public onSubmitted: EventEmitter<boolean> = new EventEmitter<boolean>();

	public get selectedEntscheid(): ApproveStatus {
		return this._selectedEntscheid;
	}
	public set selectedEntscheid(val: ApproveStatus) {
		this._selectedEntscheid = val;
		this.haveToEnterBewilligungsDatum = (val && val === ApproveStatus.FreigegebenInSchutzfrist);
	}

	public isValidDate = true;
	public isLoading = false;
	public entscheide = [];
	public haveToEnterBewilligungsDatum = false;

	private _open = true;
	private _selectedEntscheid: ApproveStatus = null;

	constructor(private _dec: EntityDecoratorService,
				private _ord: OrderService,
				private _err: ErrorService,
				private _toastr: ToastrService) {
		this.entscheide = Object.keys(ApproveStatus)
			.filter(k => isNaN(parseInt(k, 10)))
			.map(k => ApproveStatus[k])
			.filter(k => k !== ApproveStatus.NichtGeprueft && k !== ApproveStatus.FreigegebenDurchSystem);
	}

	public ngOnInit(): void {
		if (this.datumBewilligung) {
			const m = moment(this.datumBewilligung);
			this.datumBewilligung = m.isUTC()
				? moment.utc(this.datumBewilligung).format('DD.MM.YYYY')
				: moment(this.datumBewilligung).format('DD.MM.YYYY');
		}
	}

	public translateStatus(a: ApproveStatus) {
		return this._dec.translateApproveStatus(a);
	}

	public cancel() {
		this.open = false;
	}

	public checkDate(isValid) {
		this.isValidDate = isValid;
	}

	public ok() {
		if (!this.selectedEntscheid) {
			return;
		}

		const bewilligungsDatum = this.haveToEnterBewilligungsDatum ? moment.utc(this.datumBewilligung, 'DD.MM.YYYY').toDate() : null;
		if (!bewilligungsDatum && this.haveToEnterBewilligungsDatum) {
			return;
		}
		this.isLoading = true;
		this._ord.auftraegeEntscheidFreigabeHinterlegen(this.ids, this.selectedEntscheid, bewilligungsDatum, this.interneBemerkung).subscribe(r => {
			this._toastr.success('Statusänderung erfolgreich durchgeführt', 'Erfolgreich');
			this.open = false;
			this.onSubmitted.emit(true);
			this.isLoading = false;
		}, (e) => {
			this._err.showError(e);
			this.isLoading = false;
		});
	}
}
