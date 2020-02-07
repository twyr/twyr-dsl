import Component from '@glimmer/component';
import debugLogger from 'ember-debug-logger';

import { action } from '@ember/object';
import { advanceSelectableOption } from 'ember-power-select/utils/group-utils';
import { inject as service } from '@ember/service';
import { next, scheduleOnce } from '@ember/runloop';
import { nextTick } from 'ember-css-transitions/utils/transition-utils';
import { tracked } from '@glimmer/tracking';

// #region File Global Functions
const isFocusable = function isFocusable(el) {
	// is a menu-item, doesn't have tabindex -1 and is not disabled
	return el && el.tagName.toUpperCase() === 'MD-OPTION' && el.getAttribute('tabindex') !== -1 && el.getAttribute('disabled') === null && el.getAttribute('aria-disabled') !== true;
}

const waitForAnimations = function waitForAnimations(element, callback) {
	const computedStyle = window.getComputedStyle(element);

	if (computedStyle.transitionDuration && computedStyle.transitionDuration !== '0s') {
		const eventCallback = function() {
			element.removeEventListener('transitionend', eventCallback);
			callback();
		};

		element.addEventListener('transitionend', eventCallback);
	}
	else if (computedStyle.animationName !== 'none' && computedStyle.animationPlayState === 'running') {
		const eventCallback = function() {
			element.removeEventListener('animationend', eventCallback);
			callback();
		};

		element.addEventListener('animationend', eventCallback);
	}
	else {
		callback();
	}
}
// #endregion

export default class TwyrSelectEbdContentComponent extends Component {
	// #region Services
	@service constants;
	// #endregion

	// #region Private Attributes
	debug = debugLogger('twyr-select-ebd-content');
	// #endregion

	// #region Tracked Attributes
	@tracked _isActive = false;
	// #endregion

	// #region Constructor
	constructor() {
		super(...arguments);
		this.debug(`constructor`);
	}
	// #endregion

	// #region Computed Properties
	get customStyles() {
		if(this._isActive)
			return {};

		return this.otherStyles;
	}

	get destinationElement() {
		return document.getElementById(this.args.destination);
	}
	// #endregion

	// #region Private Methods
	_afterAnimateIn(dropdownElement) {
		this.args.dropdown.actions.reposition();
		this._isActive = true;

		this.focusItem(dropdownElement);
	}

	_focusOption(e, direction) {
		let focusTarget = e.target.closest('md-option');

		do {
			if (direction > 0) {
				focusTarget = focusTarget.nextElementSibling;
			} else {
				focusTarget = focusTarget.previousElementSibling;
			}
		} while (focusTarget && !isFocusable(focusTarget));

		if (focusTarget) {
			focusTarget.focus();
		}
	}
	// #endregion

	// #region Actions
	@action
	animateIn(dropdownElement) {
		next(() => {
			scheduleOnce('afterRender', this, this._afterAnimateIn, dropdownElement);
		});
	}

	@action
	animateOut(dropdownElement) {
		const parentElement = this.args.renderInPlace ? dropdownElement.parentElement.parentElement : dropdownElement.parentElement;
		const clone = dropdownElement.cloneNode(true);
		clone.id = `${clone.id}--clone`;
		parentElement.appendChild(clone);

		clone.children[0].children[0].scrollTop = dropdownElement.children[0].children[0].scrollTop;

		nextTick()
		.then(() => {
			if(this.isDestroyed) {
				parentElement.removeChild(clone);
				return;
			}

			this._isActive = false;
			clone.classList.add('md-leave');

			waitForAnimations(clone, function() {
				clone.classList.remove('md-active');
				parentElement.removeChild(clone);
			});
		});
	}

	@action
	focusItem(element) {
		let focusTarget = element.querySelector('md-option[aria-selected="true"]');

		// default to first not disabled option
		if (!focusTarget) {
			focusTarget = element.querySelector('md-option:not([aria-disabled="true"])');
		}

		if (focusTarget) {
			focusTarget.focus();
		}
	}

	@action
	handleKeyDown(ev) {
		switch (ev.which) {
			case this.constants.KEYCODE.ESCAPE:
				this.dropdown.actions.close();
			break;

			case this.constants.KEYCODE.LEFT_ARROW:
			case this.constants.KEYCODE.UP_ARROW: {
				ev.preventDefault();

				let newHighlighted = advanceSelectableOption(this.select.results, this.select.highlighted, -1);
				this.select.actions.highlight(newHighlighted, ev);
				this.select.actions.scrollTo(newHighlighted);

				this._focusOption(ev, -1);
			}
			break;

			case this.constants.KEYCODE.RIGHT_ARROW:
			case this.constants.KEYCODE.DOWN_ARROW: {
				ev.preventDefault();

				let newHighlighted = advanceSelectableOption(this.select.results, this.select.highlighted, 1);
				this.select.actions.highlight(newHighlighted, ev);
				this.select.actions.scrollTo(newHighlighted);

				this._focusOption(ev, 1);
			}
			break;

			case this.constants.KEYCODE.ENTER:
				ev.preventDefault();
				this.select.actions.choose(this.select.highlighted);
			break;
		}
	}

	@action
	shouldReposition(mutations) {
		let shouldReposition = false;

		shouldReposition = Array.prototype.slice.call(mutations[0].addedNodes).some((node) => {
			if (node.classList) {
				return !node.classList.contains('md-ripple') && (node.nodeName !== '#comment') && !(node.nodeName === '#text' && node.nodeValue === '');
			}

			return false;
		});

		shouldReposition = shouldReposition || Array.prototype.slice.call(mutations[0].removedNodes).some((node) => {
			if (node.classList) {
				return !node.classList.contains('md-ripple') && (node.nodeName !== '#comment') && !(node.nodeName === '#text' && node.nodeValue === '');
			}
			return false;
		});

		return shouldReposition;
	}
	// #endregion
}