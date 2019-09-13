import React from 'react';

import { Link } from 'wdk-client/Components';
import { useWdkEffect } from 'wdk-client/Service/WdkService';
import { Question, RecordInstance, AttributeValue } from 'wdk-client/Utils/WdkModel';
import { makeClassNameHelper, safeHtml } from 'wdk-client/Utils/ComponentUtils';

import './EbrcDescription.scss';

const cx = makeClassNameHelper('ebrc-Description');

export const useEbrcDescription = (question: Question) => {
  const [ datasetRecords, setDatasetRecords ] = React.useState(undefined as RecordInstance[] | undefined);

  useWdkEffect(wdkService => {
    (async () => {
      const answerJson = await wdkService.getAnswerJson(
        deriveAnswerSpec(question.fullName),
        REPORT_CONFIG
      );

      setDatasetRecords(answerJson.records);
    })();
  }, [ question.fullName ]);

  const DescriptionComponent = React.useCallback(
    (props: { description?: string }) => 
      <div className={cx()}>
        {
          props.description !== undefined && (
            <>
              <hr/>
              <h2 className={cx('SearchDescriptionHeader')}>Description</h2>
              {safeHtml(props.description)}
            </>
          )
        }
        {
          datasetRecords !== undefined && datasetRecords.length > 0 && (
            <>
              <hr/>
              <h2 className={cx('SearchDatasetsHeader')}>Data Sets used by this search</h2>
              <ul className={cx('DatasetsList')}>
                {datasetRecords.map(recordToAttribution)}
              </ul>
            </>
          )
        }
      </div>,
    [ datasetRecords ]
  );

  return {
    descriptionLoading: datasetRecords === undefined,
    DescriptionComponent
  };
};

const deriveAnswerSpec = (questionFullName: string) => (
  {
    searchName: 'DatasetsByQuestionName',
    searchConfig: {
      parameters: {
        question_name: questionFullName
      }
    }
  }
);

const REPORT_CONFIG = { 
  attributes: ['summary'],
  tables: ['Publications'] 
};

const recordToAttribution = (record: RecordInstance) => {
  const datasetId = record.id[0].value;
  const summaryText = typeof record.attributes.summary !== 'string' ? null : record.attributes.summary;
  const publications = record.tableErrors.includes('Publications') ? null : record.tables.Publications;

  return (
    <li key={datasetId} className={cx('DatasetItem')}>
      <Link to={`record/dataset/${datasetId}`}>{record.displayName}</Link>
      <div className={cx('Details')}>
        <div className={cx('Summary')}>
          {
            summaryText === null
              ? (
                <RecordError 
                  message={`summary attribute '${record.attributes.summary}' for data set ${datasetId} is invalid`}
                />
              )
              : safeHtml(summaryText)
          }
        </div>
        {
          publications === null && (
            <RecordError 
              message={`table 'Publications' is missing for data set ${datasetId}`}
            />
          )
        }
        {
          publications !== null && publications.length > 0 && (
            <ul className={cx('PublicationsList')}>
              {publications.map(publicationToLink)}
            </ul>
          )
        }
      </div>
    </li>
  );
};

const publicationToLink = ({ pubmed_link, dataset_id }: Record<string, AttributeValue>, i: number) => {
  const publicationLink = pubmed_link === null || typeof pubmed_link === 'string' ? null : pubmed_link;

  return (
    <li className={cx('PublicationItem')} key={publicationLink === null ? i : publicationLink.url}>
      {
        publicationLink === null
          ? <RecordError 
              message={`pubmed_link attribute '${pubmed_link}' for data set ${dataset_id} is invalid.`}
            />
          : <a href={publicationLink.url}>{safeHtml(publicationLink.displayText || publicationLink.url)}</a>
      }
    </li>
  );
};

const RecordError = (props: { message: string }) => 
  <span className={cx('RecordError')}>
    ERROR: {props.message}
    Please <Link to="/contact-us" target="_blank" >contact us</Link> to report.
  </span>;
