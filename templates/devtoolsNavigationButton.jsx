import React from 'react';
import { classes, compile } from 'core/js/reactHelpers';

export default function DevtoolsNavigationButton(props) {
  const {
    text,
    _iconClasses
  } = props;

  return (
    <>
      <span
        className={classes([
          'icon',
          _iconClasses
        ])}
        aria-hidden="true"
      />
      <span
        className="nav__btn-label"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: compile(text, props) }}
      />
    </>
  );
}
