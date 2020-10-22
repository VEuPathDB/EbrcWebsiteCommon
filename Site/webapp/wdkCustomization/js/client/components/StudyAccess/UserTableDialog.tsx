import React from 'react';

import { Dialog } from 'wdk-client/Components';

import { cx } from 'ebrc-client/components/StudyAccess/StudyAccess';

export type OpenDialogType =
  | { type: 'access-denial', userName: string };

export interface Props {
  title: React.ReactNode;
  content: React.ReactNode;
  buttonDisplay: React.ReactNode;
  buttonDisabled?: boolean;
  onButtonClick: () => void;
  onClose: () => void;
}

export function UserTableDialog({
  title,
  content,
  buttonDisplay,
  buttonDisabled,
  onButtonClick,
  onClose
}: Props) {
  return (
    <Dialog
      className={cx('--UserTableDialog')}
      title={title}
      open
      onClose={onClose}
      modal
    >
      {content}
      <button
        type="button"
        onClick={onButtonClick}
        disabled={buttonDisabled}
      >
        {buttonDisplay}
      </button>
    </Dialog>
  );
}
