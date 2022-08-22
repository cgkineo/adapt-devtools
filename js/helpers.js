define([], function(require) {

  function findLabel($element) {
    const id = $element.attr('id');
    if (!id) return false;
    const $label = $(`[for=${id}]`);
    if (!$label.length) return false;
    return computeAccesibleName($label, true);
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
    return computeAccesibleName($toElement, true);
  }

  function computeAccesibleName($element, allowText = false) {
    if ($element.is('input:not([type=checkbox], [type=radio]), select, [role=range], textarea') && $element.val()) return $element.val();
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
    if (!allowText) return '';
    return computeHeadingLevel($element) + getText($element[0]);
  }

  function computeHeadingLevel($element) {
    const $heading = $element.parents().add($element).filter('h1, h2, h3, h4, h5, h6, h7, [role=heading]');
    if (!$heading.length) return '';
    const headingLevel = parseInt($heading[0].tagName) || $heading.attr('aria-level');
    return `h${headingLevel}: `;
  }

  function computeAccessibleDescription($element) {
    const describedByText = followId($element, 'aria-describedby');
    if (describedByText) return describedByText;
    return '';
  }

  function getAnnotationPosition($element, $annotation) {
    const targetBoundingRect = $element[0].getBoundingClientRect();

    const availableWidth = $('html')[0].clientWidth;
    const availableHeight = $('html')[0].clientHeight;
    const tooltipsWidth = $annotation.width();
    const tooltipsHeight = $annotation.height();
    const elementWidth = $element.width();
    const elementHeight = $element.height();

    const canAlignBottom = targetBoundingRect.bottom + tooltipsHeight < availableHeight;
    const canAlignRight = targetBoundingRect.right + tooltipsWidth < availableWidth;
    const canAlignBottomRight = canAlignBottom && canAlignRight;
    const canBeContained = elementHeight === 0 || (elementHeight * elementWidth >= tooltipsHeight * tooltipsWidth) || $element.is('img');

    const isFixedPosition = Boolean($element.parents().add($element).filter((index, el) => $(el).css('position') === 'fixed').length);
    const scrollOffsetTop = isFixedPosition ? 0 : $(window).scrollTop();
    const scrollOffsetLeft = isFixedPosition ? 0 : $(window).scrollLeft();

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
        const isTopPreferred = availableHeight - (targetBoundingRect.bottom + tooltipsHeight) < targetBoundingRect.top - tooltipsHeight;
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
        className: 'is-right, is-bottom',
        css: {
          left: targetBoundingRect.right + scrollOffsetLeft,
          top: targetBoundingRect.bottom + scrollOffsetTop,
          'max-width': ''
        }
      };
    }
    const position = getPosition();
    position.css.position = isFixedPosition ? 'fixed' : 'absolute';
    if (position.css.left < 0) position.css.left = 0;
    position.css.left += 'px';
    position.css.top += 'px';
    if (position.css['max-width']) position.css['max-width'] += 'px';
    return position;
  }

  return {
    computeAccesibleName,
    computeAccessibleDescription,
    computeHeadingLevel,
    getAnnotationPosition
  };
});
