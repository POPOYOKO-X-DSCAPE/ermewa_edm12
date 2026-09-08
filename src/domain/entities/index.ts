import document from "./document.entity";
import email from "./email.entity";
import folder from "./folder.entity";
import nature from "./nature.entity";
import user from "./user.entity";

export default [user, folder, nature, document, email] as const;
