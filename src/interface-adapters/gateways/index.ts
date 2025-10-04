import adaptAppProfileResponse from "./app-profile/response-adapter";
import adaptDocumentResponse from './document-fetch/response-adapter';
import adaptDocumentUpdateRequest from "./document-update/request-adapter";
import adaptDocumentUploadRequest from "./document-upload/request-adapter";
import adaptDocumentDeleteRequest from "./document-delete/request-adapter";
import adaptFileBodyRequest from "./file/request-adapter";
import adaptFolderTree from "./folder-tree/response-adapter";
import adaptNatureMasks from "./nature-mask/response-adapter";
import adaptNatures from "./nature/response-adapter";
import adaptRejectEmailInfo from './reject-email-info/response-adapter';

export {
  adaptAppProfileResponse,
  adaptFolderTree,
  adaptNatures,
  adaptNatureMasks,
  adaptDocumentResponse,
  adaptDocumentUploadRequest,
  adaptFileBodyRequest,
  adaptDocumentUpdateRequest,
  adaptDocumentDeleteRequest,
  adaptRejectEmailInfo,
};
