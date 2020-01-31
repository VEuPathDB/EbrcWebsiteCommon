import { record, string, arrayOf, constant, combine, Unpack, oneOf, objectOf, number, boolean, optional } from "wdk-client/Utils/Json";

const siteSearchCategory = record({
  name: string,
  documentTypes: arrayOf(string)
});

const siteSearchDocumentTypeField = record({
  name: string,
  displayName: string,
  // wdk search vocab term
  term: string
});

const siteSearchDocumentTypeBase = record({
  id: string,
  displayName: string,
  displayNamePlural: string,
  count: number,
  hasOrganismField: boolean,
  summaryFields: arrayOf(siteSearchDocumentTypeField)
});

const standardSiteSearchDocumentType = combine(
  siteSearchDocumentTypeBase,
  record({
    isWdkRecordType: constant(false)
  })
);

const wdkSiteSearchDocumentType = combine(
  siteSearchDocumentTypeBase,
  record({
    isWdkRecordType: constant(true),
    wdkRecordTypeData: record({
      searchFields: arrayOf(siteSearchDocumentTypeField),
      searchName: string
    })
  })
);

const siteSearchDocumentType = oneOf(standardSiteSearchDocumentType, wdkSiteSearchDocumentType);

const siteSearchDocument = record({
  documentType: string,
  primaryKey: arrayOf(string),
  summaryFieldData: objectOf(oneOf(string, arrayOf(string))),
  foundInFields: arrayOf(string),
  wdkPrimaryKeyString: optional(string),
  organism: optional(string)
});

const siteSearchResults = record({
  totalCount: number,
  documents: arrayOf(siteSearchDocument)
});

export const siteSearchResponse = record({
  categories: arrayOf(siteSearchCategory),
  documentTypes: arrayOf(siteSearchDocumentType),
  organismCounts: objectOf(number),
  searchResults: siteSearchResults
});

export type SiteSearchDocument = Unpack<typeof siteSearchDocument>;
export type SiteSearchDocumentType = Unpack<typeof siteSearchDocumentType>;
export type SiteSearchResponse = Unpack<typeof siteSearchResponse>;


export interface SiteSerachRequest {
  searchText: string;
  pagination: {
    offset: number;
    numRecords: number; // max is 50
  };
  restrictToProject?: string;
  restrictMetadataToOrganisms?: string[];
  restrictSearchToOrganisms?: string[]; // (must be subset of metadata orgs)
  documentTypeFilter?: {
    documentType: string;
    foundOnlyInFields?: string[];
  };
}