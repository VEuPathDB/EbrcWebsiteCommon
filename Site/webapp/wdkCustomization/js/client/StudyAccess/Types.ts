import { record, string, arrayOf, constant, combine, Unpack, oneOf, objectOf, number, boolean, optional } from "wdk-client/Utils/Json";


const publicStrategy = record({
    lastViewed: string,
    rootStepId: number,
    signature: string,
    author: string,
    releaseVersion: string,
    isValid: boolean,
    description: string,
    leafAndTransformStepCount: number,
    isDeleted: boolean,
    estimatedSize: optional(number),
    isSaved: boolean,
    isExample: boolean,
    organization: string,
    name: string,
    recordClassName: string,
    createdTime: string,
    isPublic: boolean,
    strategyId: number,
    lastModified: string,
    nameOfFirstStep: string
});


export const publicStrategyResponse = arrayOf(publicStrategy);

export type PublicStrategyResponse = Unpack<typeof publicStrategyResponse>;



// from SiteSearch Request and Response types

const studyAccessResults = record({
  totalCount: number,
  publicStrats: arrayOf(publicStrategy)
});
export const studyAccessResponse = record({
  validCounts: optional(objectOf(number)),
  rowsResults: studyAccessResults
});
export type StudyAccessResponse = Unpack<typeof studyAccessResponse>;

export interface StudyAccessRequest {
  searchText: string;
  restrictToProject?: string;
}



// API  defined in https://veupathdb.github.io/service-dataset-access/api.html#type:lib.DatastoreId
export type StaffUser =  {
  staffId: number, 
  user: { 
          userId: number, 
          firstName: string, 
          lastName: string, 
          organisation: string 
        }, 
  isOwner: boolean
}
export type GetStaffTableResponse =  {
  data: StaffUser[],
  rows: 1,
  offset: 0,
  total: 1
}


