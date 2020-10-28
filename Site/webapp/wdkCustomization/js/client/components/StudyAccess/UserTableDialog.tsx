import React, { useEffect, useRef, useState } from 'react';

import { partition } from 'lodash';

import { Dialog, TextArea } from 'wdk-client/Components';

import { cx } from 'ebrc-client/components/StudyAccess/StudyAccess';
import { EMAIL_REGEX } from 'ebrc-client/util/email';

export interface Props {
  title: React.ReactNode;
  content: React.ReactNode;
  onClose: () => void;
}

export function UserTableDialog({
  title,
  content,
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
    </Dialog>
  );
}

export type ContentProps =
  | { type: 'access-denial' } & AccessDenialContentProps
  | { type: 'add-providers' } & AddProvidersContentProps
  | { type: 'users-added' } & UsersAddedContentProps;

interface AccessDenialContentProps {
  userName: string;
  onSubmit: (denialReason: string) => void;
}

export function AccessDenialContent({ onSubmit, userName }: AccessDenialContentProps) {
  const [ denialReason, setDenialReason ] = useState('');

  return (
    <form
      className={cx('--AccessDenialContent')}
      onSubmit={event => {
        event.preventDefault();
        onSubmit(denialReason);
      }}
    >
      <div className={cx('--AccessDenialReason')}>
        <p>You are denying {userName} access to this study. Please provide a reason:</p>
        <TextArea
          required
          value={denialReason}
          onChange={setDenialReason}
          rows={6}
          cols={100}
        />
      </div>
      <div className={cx('--AccessDenialSubmit')}>
        <button
          type="submit"
          className="btn"
        >
          Submit
        </button>
      </div>
    </form>
  );
}

interface AddProvidersContentProps {
  onSubmit: (providerEmails: string[]) => void;
}

export function AddProvidersContent({ onSubmit }: AddProvidersContentProps) {
  const [ providerEmailField, setProviderEmailField ] = useState('');
  const [ providerEmails, setProviderEmails ] = useState()

  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const draftEmails = providerEmailField.split(/[,;\s]+/g).filter(x => x.length > 0);

    const [ validEmails, invalidEmails ] = partition(draftEmails, email => EMAIL_REGEX.test(email));

    setProviderEmails(validEmails);

    if (ref.current != null) {
      if (invalidEmails.length > 0) {
        ref.current.setCustomValidity(`Please correct the following emails: ${invalidEmails.join(', ')}.`);
      } else {
        ref.current.setCustomValidity('');
      }
    }
  }, [ providerEmailField ]);

  return (
    <form
      className={cx('--AddProvidersContent')}
      onSubmit={event => {
        event.preventDefault();
        onSubmit(providerEmails);
      }}
    >
      <div className={cx('--AddProvidersEmailField')}>
        <p>Please input the emails of the providers you wish to add:</p>
        <textarea
          required
          ref={ref}
          value={providerEmailField}
          onChange={(e) => {
            setProviderEmailField(e.target.value)
          }}
          rows={6}
          cols={100}
        />
      </div>
      <div className={cx('--AddProvidersSubmit')}>
        <button
          type="submit"
          className="btn"
        >
          Submit
        </button>
      </div>
    </form>
  );
}

interface UsersAddedContentProps {
  createdUsers: string[];
  emailedUsers: string[];
  permissionName: string;
  onConfirm: () => void;
}

export function UsersAddedContent({
  createdUsers,
  emailedUsers,
  permissionName,
  onConfirm
}: UsersAddedContentProps) {
  return (
    <div className={cx('--UsersAddedContent')}>
      {
        createdUsers.length > 0 &&
        <div className={cx('--UsersAddedCreatedUsers')}>
          <h2>Added Users:</h2>
          <p>The following users have been granted {permissionName}-level access to this study:</p>
          <ul>
            {
              createdUsers.map(
                (createdUser, i) => (
                  <li key={i}>{createdUser}</li>
                )
              )
            }
          </ul>
        </div>
      }
      {
        emailedUsers.length > 0 &&
        <div className={cx('--UsersAddedEmailedUsers')}>
          <h2>Emailed Users:</h2>
          <p>The following users do not have an existing account, and have been invited to register with us. Once they register, they will be granted {permissionName}-level access to this study:</p>
          <ul>
            {
              emailedUsers.map(
                (emailedUser, i) => (
                  <li key={i}>{emailedUser}</li>
                )
              )
            }
          </ul>
        </div>
      }
      <div className={cx('--UsersAddedConfirm')}>
        <button
          type="button"
          className="btn"
          onClick={onConfirm}
        >
          OK
        </button>
      </div>
    </div>
  );
}
