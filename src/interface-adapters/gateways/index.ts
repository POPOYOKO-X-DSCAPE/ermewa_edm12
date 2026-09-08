import { appProfileAdapter } from "./app-profile.adapter";
import { displaySelectAdapter } from "./display-select.adapter";
import { documentDeleteAdapter } from "./document-delete.adapter";
import { documentUpdateAdapter } from "./document-update.adapter";
import { documentUploadAdapter } from "./document-upload.adapter";
import { documentAdapter } from "./document.adapter";
import { fileAdapter } from "./file.adapter";
import { folderTreeAdapter } from "./folder-tree.adapter";
import { naturesMasksAdapter } from "./natures-masks.adapter";
import { naturesAdapter } from "./natures.adapter";
import { rejectEmailInfoAdapter } from "./reject-email-info.adapter";
import { sendMailAdapter } from "./send-mail.adapter";

export default [
	appProfileAdapter,
	documentAdapter,
	documentDeleteAdapter,
	documentUpdateAdapter,
	documentUploadAdapter,
	sendMailAdapter,
	rejectEmailInfoAdapter,
	fileAdapter,
	folderTreeAdapter,
	naturesAdapter,
	naturesMasksAdapter,
	displaySelectAdapter,
];
