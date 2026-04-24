export const HEADING_SELECTOR = 'h1,h2,h3,h4,h5,h6,[role=heading]';

function findLabel($element) {
  const id = $element.attr('id');
  if (!id) return false;
  const $label = $(`[for=${id}]`);
  if (!$label.length) return false;
  return computeAccessibleName($label, true);
}

function getText(domElement) {
  if ($(domElement).attr('aria-hidden') === 'true') return;
  const text = [];
  function traverseTree(root) {
    if ($(root).attr('aria-hidden') === 'true') return;
    Array.prototype.forEach.call(root.childNodes, child => {
      if (child.nodeType !== 3) return traverseTree(child);
      const str = child.nodeValue.trim();
      if (str.length === 0) return;
      text.push(str);
    });
  }
  traverseTree(domElement);
  return text.join(' ');
}

function followId($element, property) {
  const id = $element.attr(property);
  if (!id) return false;
  const $toElement = $(`#${id}`);
  if (!$toElement.length) return false;
  return computeAccessibleName($toElement, true);
}

export function computeAccessibleName($element, allowText = false) {
  if ($element.is('input:not([type=checkbox], [type=radio]), select, [role=range], textarea') && $element.val()) return $element.val();
  const ariaHidden = $element.attr('aria-hidden');
  if (ariaHidden === 'true') return '<span class="u-nobr">N/A (hidden from assistive technologies)</span>';
  const labelledByText = followId($element, 'aria-labelledby');
  if (labelledByText) return labelledByText;
  const activeDescendantText = followId($element, 'aria-activedescendant');
  if (activeDescendantText) return activeDescendantText;
  const ariaLabel = $element.attr('aria-label');
  if (ariaLabel) return ariaLabel;
  const findLabelText = findLabel($element);
  if (findLabelText) return findLabelText;
  const valueText = $element.attr('aria-valuetext');
  if (valueText) return valueText;
  const valueNow = $element.attr('aria-valuenow');
  if (valueNow) return valueNow;
  const alt = $element.attr('alt');
  if (alt) return alt;
  const childAriaLabel = !$element.is(HEADING_SELECTOR) &&
    $element.find('.aria-label').first().text();
  if (childAriaLabel) return childAriaLabel;
  if (!allowText) return '';
  return computeHeadingLevel($element) + getText($element[0]);
}

function computeHeadingLevel($element) {
  const $heading = $element.parents().add($element).filter(HEADING_SELECTOR);
  if (!$heading.length) return '';
  const headingLevel = parseInt($heading[0].tagName) || $heading.attr('aria-level');
  return `h${headingLevel}: `;
}

export function computeAccessibleDescription($element) {
  const describedByText = followId($element, 'aria-describedby');
  if (describedByText) return describedByText;
  return '';
}

export function getContainer($element) {
  const $fixedParent = $element.parents().add($element).filter((index, el) => $(el).css('position') === 'fixed');
  return $fixedParent.length ? $fixedParent : $('body');
}

export function shouldAnnotate($element) {
  const shouldAnnotate = isVisible($element) && isReadable($element);
  return shouldAnnotate;
}

function isVisible($element) {
  const isHeadingHeightZero = $element.is(HEADING_SELECTOR) && $element.height() === 0;
  const isVisible = !isHeadingHeightZero && isInDom($element) && $element.onscreen().onscreen;
  return isVisible;
}

function isReadable($element) {
  const isImg = $element.is('img');
  const isAncestorAriaHidden = Boolean($element.parents().filter('[aria-hidden=true]').length);
  const isAriaHidden = Boolean($element.filter('[aria-hidden=true]').length);
  const isNotAriaHidden = Boolean($element.filter('[aria-hidden=false]').length);
  const hasAccessibleName = Boolean(computeAccessibleName($element) || computeAccessibleDescription($element));
  const isReadable = !isAncestorAriaHidden && (isNotAriaHidden || !isAriaHidden || isImg || (hasAccessibleName && !isAriaHidden));
  return isReadable;
}

function isInDom($element) {
  const isInDom = $element.parents('html').length > 0;
  return isInDom;
}

function isFixed($element) {
  const isFixed = Boolean($element.parents().add($element).filter((index, el) => $(el).css('position') === 'fixed').length);
  return isFixed;
}

export function getAnnotationPosition($element, $annotation) {
  const $annotationContainer = getContainer($element);
  const containerBoundingRect = $annotationContainer[0].getBoundingClientRect();
  const targetBoundingRect = $element[0].getBoundingClientRect();
  const availableWidth = $annotationContainer.width();
  const availableHeight = $annotationContainer.height();
  const tooltipsWidth = $annotation.width();
  const tooltipsHeight = $annotation.height();
  const elementWidth = $element.width();
  const elementHeight = $element.height();
  const scrollOffsetTop = -containerBoundingRect.top + $annotationContainer.scrollTop();
  const scrollOffsetLeft = -containerBoundingRect.left + $annotationContainer.scrollLeft();

  const canAlignBottom = targetBoundingRect.bottom + tooltipsHeight < availableHeight;
  const canAlignRight = targetBoundingRect.right + tooltipsWidth < availableWidth;
  const canAlignBottomRight = canAlignBottom && canAlignRight;
  const canBeContained = elementHeight === 0 || (elementHeight * elementWidth >= tooltipsHeight * tooltipsWidth) || $element.is('img');
  function getPosition() {
    if (canBeContained) {
      return {
        className: 'is-contained',
        css: {
          left: targetBoundingRect.left + scrollOffsetLeft,
          top: targetBoundingRect.top + scrollOffsetTop,
          'max-width': (elementHeight === 0) ? '' : elementWidth
        }
      };
    }
    if (!canAlignBottomRight) {
      // Find the 'corner' with the most space from the viewport edge
      const isHardTop = isFixed($annotationContainer) && (containerBoundingRect.top < tooltipsHeight && targetBoundingRect.top < tooltipsHeight);
      const isTopPreferred = !isHardTop && (availableHeight - (targetBoundingRect.bottom + tooltipsHeight) < targetBoundingRect.top - tooltipsHeight);
      const isLeftPreferred = availableWidth - (targetBoundingRect.right + tooltipsWidth) < targetBoundingRect.left - tooltipsWidth;
      if (isTopPreferred && isLeftPreferred) {
        // Top left
        return {
          className: 'is-left is-top',
          css: {
            left: targetBoundingRect.left - tooltipsWidth + scrollOffsetLeft,
            top: targetBoundingRect.top - tooltipsHeight + scrollOffsetTop,
            'max-width': ''
          }
        };
      }
      if (isTopPreferred) {
        // Top right
        return {
          className: 'is-right is-top',
          css: {
            left: targetBoundingRect.right + scrollOffsetLeft,
            top: targetBoundingRect.top - tooltipsHeight + scrollOffsetTop,
            'max-width': ''
          }
        };
      }
      if (isLeftPreferred) {
        // Bottom left
        return {
          className: 'is-left is-bottom',
          css: {
            left: targetBoundingRect.left - tooltipsWidth + scrollOffsetLeft,
            top: targetBoundingRect.bottom + scrollOffsetTop,
            'max-width': ''
          }
        };
      }
    }
    // Bottom right, default
    return {
      className: 'is-right is-bottom',
      css: {
        left: targetBoundingRect.right + scrollOffsetLeft,
        top: targetBoundingRect.bottom + scrollOffsetTop,
        'max-width': ''
      }
    };
  }
  const position = getPosition();
  position.css.position = 'absolute';
  if (position.css.left < 0) position.css.left = 0;
  position.css.left += 'px';
  position.css.top += 'px';
  if (position.css['max-width']) position.css['max-width'] += 'px';
  return position;
}

export default {
  HEADING_SELECTOR,
  computeAccessibleName,
  computeAccessibleDescription,
  getAnnotationPosition,
  getContainer
};
