import {Component, EventEmitter, Input, Output} from '@angular/core';
@Component({
	selector: 'cmi-viaduc-delete-confirm',
	templateUrl: 'deleteConfirm.component.html'
})
export class DeleteConfirmComponent {
	@Input()
	public controlId: string;

	@Input()
	public nameOfSelectedItem: any;

	@Input()
	public countOfSelectedItem: number;

	@Output() // 2-Way-Binding {Variable + 'Change'}
	public showDeleteModalChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Input()
	public get showDeleteModal() {
		return this._showDeleteModal;
	}

	public set showDeleteModal(val) {
		this._showDeleteModal = val;
		this.showDeleteModalChange.emit(val);
	}

	private _showDeleteModal: boolean;

	@Output()
	public deleteClicked: EventEmitter<void> = new EventEmitter<void>();

	@Output()
	public cancelClicked: EventEmitter<void> = new EventEmitter<void>();

	public onDeleteClick(event): void {
		this.deleteClicked.emit();
		this.showDeleteModal = false;
	}

	public onCancelClick(event): void {
		this.cancelClicked.emit();
		this.showDeleteModal = false;
	}
}
