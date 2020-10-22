import React, { useState } from 'react';

import { Dialog, TextArea } from 'wdk-client/Components';

import { cx } from 'ebrc-client/components/StudyAccess/StudyAccess';

export interface Props<P> {
  title: React.ReactNode;
  contentProps: P;
  ContentComponent: React.ComponentType<P>;
  onClose: () => void;
}

export type ContentProps =
  | AccessDenialContentProps;

export function UserTableDialog<P>({
  title,
  contentProps,
  ContentComponent,
  onClose
}: Props<P>) {
  return (
    <Dialog
      className={cx('--UserTableDialog')}
      title={title}
      open
      onClose={onClose}
      modal
    >
      <ContentComponent {...contentProps} />
    </Dialog>
  );
}

interface AccessDenialContentProps {
  type: 'access-denial';
  userName: string;
  onSubmit: (denialReason: string) => void;
}

export function AccessDenialContent({ onSubmit, userName }: AccessDenialContentProps) {
  const [ denialReason, setDenialReason ] = useState('');

  return (
    <div className={cx('--AccessDenialContent')}>
      <div className={cx('--AccessDenialReason')}>
        You are denying {userName} access to this study. Please provide a reason:
        <TextArea
          value={denialReason}
          onChange={setDenialReason}
          rows={6}
          cols={100}
        />
      </div>
      <div className={cx('--AccessDenialSubmit')}>
        <button
          type="button"
          className="btn"
          onClick={() => {
            onSubmit(denialReason);
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
