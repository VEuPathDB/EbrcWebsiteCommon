import {
  Unpack,
  arrayOf,
  boolean,
  combine,
  constant,
  number,
  objectOf,
  oneOf,
  optional,
  record,
  string
} from 'wdk-client/Utils/Json';

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
export const datastoreId = number;

export type DatastoreId = Unpack<typeof datastoreId>;

export const userDetails = record({
  userId: number,
  firstName: string,
  lastName: string,
  organization: string
});

export type UserDetails = Unpack<typeof userDetails>;

export const staff = record({
  staffId: datastoreId,
  user: userDetails,
  isOwner: boolean
});

export type Staff = Unpack<typeof staff>;

export const staffList = record({
  data: arrayOf(staff),
  rows: number,
  offset: number,
  total: number
});

export type StaffList = Unpack<typeof staffList>;

export const newStaffRequest = record({
  userId: number,
  isOwner: boolean
});

export type NewStaffRequest = Unpack<typeof newStaffRequest>;

export const newStaffResponse = record({
  staffId: number
});

export type NewStaffResponse = Unpack<typeof newStaffResponse>;

export const staffPatch = record({
  op: constant('replace'),
  path: constant('isOwner'),
  value: boolean
});

export type StaffPatch = Unpack<typeof staffPatch>;

export const restrictionLevel = oneOf(
  constant('public'),
  constant('prerelease'),
  constant('protected'),
  constant('controlled'),
  constant('private')
);

export type RestrictionLevel = Unpack<typeof restrictionLevel>;

export const approvalStatus = oneOf(
  constant('approved'),
  constant('requested'),
  constant('denied')
);

export type ApprovalStatus = Unpack<typeof approvalStatus>;

export const endUser = record({
  user: userDetails,
  datasetId: string,
  startDate: optional(string),
  duration: optional(number),
  restrictionLevel,
  purpose: string,
  researchQuestion: string,
  analysisPlan: string,
  disseminationPlan: string,
  approvalStatus,
  denialReason: optional(string),
  priorAuth: string
});

export type EndUser = Unpack<typeof endUser>;

export const endUserCreateRequest = combine(
  oneOf(
    record({ userId: number }),
    record({ email: string })
  ),
  record({
    purpose: string,
    researchQuestion: string,
    analysisPlan: string,
    disseminationPlan: string,
    priorAuth: string,
    datasetId: string,
    startDate: optional(string),
    duration: optional(number),
    restrictionLevel: optional(restrictionLevel),
    approvalStatus: optional(approvalStatus),
    denialReason: optional(string)
  })
);

export type EndUserCreateRequest = Unpack<typeof endUserCreateRequest>;

export const endUserCreateResponse = oneOf(
  record({
    created: constant(false)
  }),
  record({
    created: constant(true),
    endUserId: string
  })
);

export type EndUserCreateResponse = Unpack<typeof endUserCreateResponse>;

export const endUserList = record({
  data: arrayOf(endUser),
  rows: number,
  offset: number,
  total: number
});

export type EndUserList = Unpack<typeof endUserList>;

export const endUserPatchOp = oneOf(
  constant('add'),
  constant('remove'),
  constant('replace')
);

export const endUserPatch = record({
  op: endUserPatchOp,
  path: string,
  value: optional(string),
  from: optional(string)
});
