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
    return getText($element[0]);
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

    const canAlignBottom = targetBoundingRect.bottom + tooltipsHeight < availableHeight;
    const canAlignRight = targetBoundingRect.right + tooltipsWidth < availableWidth;
    const canAlignBottomRight = canAlignBottom && canAlignRight;

    const isFixedPosition = Boolean($element.parents().add($element).filter((index, el) => $(el).css('position') === 'fixed').length);
    const scrollOffsetTop = isFixedPosition ? 0 : $(window).scrollTop();
    const scrollOffsetLeft = isFixedPosition ? 0 : $(window).scrollLeft();

    function getPosition() {
      if (!canAlignBottomRight) {
        // Find the 'corner' with the most space from the viewport edge
        const isTopPreferred = availableHeight - (targetBoundingRect.bottom + tooltipsHeight) < targetBoundingRect.top - tooltipsHeight;
        const isLeftPreferred = availableWidth - (targetBoundingRect.right + tooltipsWidth) < targetBoundingRect.left - tooltipsWidth;
        if (isTopPreferred && isLeftPreferred) {
          // Top left
          return {
            left: `${targetBoundingRect.left - tooltipsWidth + scrollOffsetLeft}px`,
            top: `${targetBoundingRect.top - tooltipsHeight + scrollOffsetTop}px`
          };
        }
        if (isTopPreferred) {
          // Top right
          return {
            left: `${targetBoundingRect.right + scrollOffsetLeft}px`,
            top: `${targetBoundingRect.top - tooltipsHeight + scrollOffsetTop}px`
          };
        }
        if (isLeftPreferred) {
          // Bottom left
          return {
            left: `${targetBoundingRect.left - tooltipsWidth + scrollOffsetLeft}px`,
            top: `${targetBoundingRect.bottom + scrollOffsetTop}px`
          };
        }
      }
      // Bottom right, default
      return {
        left: `${targetBoundingRect.right + scrollOffsetLeft}px`,
        top: `${targetBoundingRect.bottom + scrollOffsetTop}px`
      };
    }
    return Object.assign(getPosition(), { position: isFixedPosition ? 'fixed' : 'absolute' });
  }

  return {
    computeAccesibleName,
    computeAccessibleDescription,
    getAnnotationPosition
  };
});
