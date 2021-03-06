import Component from '@glimmer/component';
import debugLogger from 'ember-debug-logger';

import { action } from '@ember/object';

export default class TwyrDialogContainerComponent extends Component {
	// #region Private Attributes
	debug = debugLogger('twyr-dialog-container');
	_element = null;
	// #endregion

	// #region Constructor
	constructor() {
		super(...arguments);
		this.debug(`constructor`);
	}
	// #endregion

	// #region Lifecycle Hooks
	@action
	didInsert(element) {
		this.debug(`didInsert`);
		this._element = element;
	}
	// #endregion

	// #region DOM Event Handlers
	@action
	handleMouseDown(event) {
		this.debug(`handleMouseDown`);
		this._sourceElem = event.target;
	}

	@action
	handleMouseUp(event) {
		this.debug(`handleMouseUp`);
		if(this._sourceElem !== this._element)
			return;

		if(event.target !== this._element)
			return;

		event.preventDefault();
		event.stopPropagation();

		if(!this.args.outsideClicked)
			return;

		if(typeof this.args.outsideClicked !== 'function')
			return;

		this.args.outsideClicked(event);
	}
	// #region
}
