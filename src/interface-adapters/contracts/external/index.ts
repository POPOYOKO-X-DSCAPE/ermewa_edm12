import { appProfileExternalSchema } from "./app-profile.external";
import { displaySelectExternalPayloadSchema } from "./display-select.external";

import {
	documentDeleteExternalBodySchema,
	documentDeleteExternalPayloadSchema,
} from "./document-delete.external";
import {
	documentUpdateExternalBodySchema,
	documentUpdateExternalPayloadSchema,
} from "./document-update.external";
import {
	documentUploadExternalBodySchema,
	documentUploadExternalPayloadSchema,
} from "./document-upload.external";
import { documentExternalSchema } from "./document.external";
import { fileExternalBodySchema } from "./file.external";
import { folderTreeExternalPayloadSchema } from "./folder-tree.external";
import { naturesMasksExternalPayloadSchema } from "./natures-mask.sexternal";
import { naturesExternalPayloadSchema } from "./natures.external";
import { rejectEmailInfoExternalPayloadSchema } from "./reject-email-info.external";
import {
	sendMailExternalBodySchema,
	sendMailExternalPayloadSchema,
} from "./send-mail.external";

export {
	appProfileExternalSchema,
	documentExternalSchema,
	documentDeleteExternalBodySchema,
	documentDeleteExternalPayloadSchema,
	documentUpdateExternalBodySchema,
	documentUpdateExternalPayloadSchema,
	documentUploadExternalBodySchema,
	documentUploadExternalPayloadSchema,
	rejectEmailInfoExternalPayloadSchema,
	fileExternalBodySchema,
	folderTreeExternalPayloadSchema,
	naturesExternalPayloadSchema,
	naturesMasksExternalPayloadSchema,
	sendMailExternalBodySchema,
	sendMailExternalPayloadSchema,
	displaySelectExternalPayloadSchema,
};
