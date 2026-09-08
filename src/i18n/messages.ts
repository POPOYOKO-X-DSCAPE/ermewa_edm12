import type { SupportedLocale } from "./locale";

type LocalMessageMap = Record<string, string>;

const en: LocalMessageMap = {
	// Header
	headerFolders: "Folders",
	headerSwitchTheme: "Switch theme",
	headerReload: "Reload",

	// Sidebar
	sidebarFilters: "Filters",
	sidebarMandatoryOnly: "Mandatory only",
	sidebarAll: "All",
	sidebarUnsavedDocuments: "Unsaved documents",
	sidebarLoading: "Loading...",

	// Unsaved documents badges
	sidebarBadgeUnsavedChanges: "unsaved changes",
	sidebarBadgeNotUploaded: "not yet uploaded document",

	// Create document dialog
	createDocumentTitle: "Add document",
	createDocumentExisting: "Add an existing document",
	createDocumentDocumentName: "Document Name :",
	createDocumentDocumentNamePlaceholder: "e.g., MNR",
	createDocumentNoResultNatureContext: "Loading nature context...",
	createDocumentNoCompatibleDocuments: "No compatible documents found",
	createDocumentNoResults: "No results found",
	createDocumentOr: "or",
	createDocumentFromDisk: "Add from disk",
	createDocumentChooseFile: "Choose a file",
	createDocumentConfirm: "Confirm",
	createDocumentFilesSelected: "{count} files selected",

	// Display select
	displaySelectTitle: "Folder Selection",
	displaySelectManualTitle: "Manual folder selection",
	displaySelectFolderName: "Folder name",
	displaySelectFolderNumber: "Folder number",
	displaySelectLoadFolder: "Load folder",
	displaySelectFolderNameRequired: "Folder name is required.",
	displaySelectFolderNumberRequired: "Folder number is required.",
	displaySelectLoading: "Loading folders...",
	displaySelectLoadError: "Unable to load folders.",
	displaySelectInvalidConfiguration:
		"The folder selection configuration is invalid.",
	displaySelectRequestFailed: "Unable to load folders.",
	displaySelectValidationFailed:
		"The folder selection result is invalid.",
	displaySelectLoadFailed: "Unable to load folders.",
	displaySelectMissingLayout:
		"The display selection layout is missing.",
	displaySelectMissingBindings:
		"The display selection bindings are missing.",
	displaySelectMissingSelectAction:
		"The display selection action is missing.",
	displaySelectShowingResult:
		"Showing {visible} of {filtered} matching folders ({total} total).",
	displaySelectFilters: "Filters",
	displaySelectClearFilters: "Clear filters",
	displaySelectNoMatches: "No folder matches the current filters.",
	displaySelectShowAllRemaining: "Show all ({count} remaining)",

	// Loading
	loadingFolders: "Loading folders",
	loadingView: "Your view is loading",
	loadingDocument: "Loading document…",
	selectDocumentToStart: "Select a document to get started",

	// Document viewer
	viewerDate: "Date",
	viewerExpires: "Expires",
	viewerEditMeta: "Edit meta",
	viewerEditMetadata: "Edit metadata",
	viewerMetaName: "Name *",
	viewerMetaDate: "Date *",
	viewerMetaExpires: "Expires",
	viewerMetaApply: "Apply",
	viewerChangeStatus: "Change status",
	viewerFile: "File",
	viewerReplaceFile: "Replace file",
	viewerCancel: "Cancel",
	viewerZoom: "Zoom",
	viewerAddPage: "Add page",
	viewerZoomIn: "Zoom in",
	viewerZoomOut: "Zoom out",
	viewerFitWidth: "Fit width",
	viewerFitHeight: "Fit height",
	viewerRotateClockwise: "Rotate clockwise",
	viewerRotateAnticlockwise: "Rotate anticlockwise",
	viewerCopyPage: "Copy page {page}",
	viewerDeletePage: "Delete page {page}",
	viewerRotatePageClockwise: "Rotate page {page} clockwise",
	viewerRotatePageAnticlockwise: "Rotate page {page} anticlockwise",
	viewerTextDocument: "Text document",
	viewerUnsupportedType: "Unsupported document type",
	viewerStatus: "Status",

	// Email
	emailTitle: "Send document by email",
	emailRejectTitle: "Reject document and send email",
	emailRejectSubmit: "Reject",
	emailFrom: "From *",
	emailTo: "To *",
	emailCc: "CC",
	emailBcc: "BCC",
	emailSubject: "Subject *",
	emailMessage: "Message *",
	emailBody: "Message",
	emailSend: "Send",
	emailDismiss: "Dismiss",
	emailRejectionReason: "Rejection reason",
	emailViewerFrom: "From:",
	emailViewerTo: "To:",
	emailFailedToLoad: "Failed to load .msg file.",
	emailFailedToReplaceFile: "Failed to replace file",
	emailFailedToSend: "Failed to send email",
	emailFailedToReject: "Failed to reject document",

	// Document actions (viewer & sidebar)
	actionSave: "Save",
	actionUpload: "Upload",
	actionDownload: "Download",
	actionEmail: "Email",
	actionCopy: "Copy",
	actionPaste: "Paste",
	actionPending: "Pending",
	actionValidate: "Validate",
	actionReject: "Reject",
	actionRemove: "Remove",
	actionDelete: "Delete",

	// Status (XPRM FLD_* codes + document states)
	statusPending: "Pending",
	statusValidated: "Validated",
	statusRejected: "Rejected",
	statusRemoved: "Removed",
	statusOngoing: "Ongoing",
	statusPlanning: "Planned",
	statusNotApplicable: "N/A",
	statusUnknown: "Unknown",

	// Dialogs & alerts
	alertImportAsPdf:
		'Import "{name}" as a PDF?\n\nPress OK to convert it to PDF.\nPress Cancel to keep the original image format.',
	alertReplaceFileChoice:
		"Press OK to replace the current file.\nPress Cancel to add the clipboard document as new pages to the current PDF.",
	alertReplaceFileConfirm:
		"This will replace the current file. Do you want to continue?",
	alertMonoDocumentRedirect:
		'A document already exists in mono-document nature "{nature}". You will be redirected to it.',
	alertDuplicateFailed: "Unable to duplicate this document.",

	// Status codes (XDOC STATE 1..5)
	statusUploaded: "Uploaded",
};

const fr: LocalMessageMap = {
	// Header
	headerFolders: "Dossiers",
	headerSwitchTheme: "Changer de thème",
	headerReload: "Recharger",

	// Sidebar
	sidebarFilters: "Filtres",
	sidebarMandatoryOnly: "Obligatoires uniquement",
	sidebarAll: "Tous",
	sidebarUnsavedDocuments: "Documents non sauvegardés",
	sidebarLoading: "Chargement...",

	// Unsaved documents badges
	sidebarBadgeUnsavedChanges: "modifications non sauvegardées",
	sidebarBadgeNotUploaded: "document pas encore chargé",

	// Create document dialog
	createDocumentTitle: "Ajouter un document",
	createDocumentExisting: "Ajouter un document existant",
	createDocumentDocumentName: "Nom du document :",
	createDocumentDocumentNamePlaceholder: "p. ex., MNR",
	createDocumentNoResultNatureContext:
		"Chargement du contexte nature...",
	createDocumentNoCompatibleDocuments:
		"Aucun document compatible trouvé",
	createDocumentNoResults: "Aucun résultat",
	createDocumentOr: "ou",
	createDocumentFromDisk: "Ajouter depuis le disque",
	createDocumentChooseFile: "Choisir un fichier",
	createDocumentConfirm: "Confirmer",
	createDocumentFilesSelected: "{count} fichiers sélectionnés",

	// Display select
	displaySelectTitle: "Sélection de dossier",
	displaySelectManualTitle: "Sélection manuelle d'un dossier",
	displaySelectFolderName: "Nom du dossier",
	displaySelectFolderNumber: "Numéro de dossier",
	displaySelectLoadFolder: "Charger le dossier",
	displaySelectFolderNameRequired: "Le nom du dossier est requis.",
	displaySelectFolderNumberRequired: "Le numéro de dossier est requis.",
	displaySelectLoading: "Chargement des dossiers...",
	displaySelectLoadError: "Impossible de charger les dossiers.",
	displaySelectInvalidConfiguration:
		"La configuration de sélection de dossier est invalide.",
	displaySelectRequestFailed: "Impossible de charger les dossiers.",
	displaySelectValidationFailed:
		"Le résultat de la sélection de dossier est invalide.",
	displaySelectLoadFailed: "Impossible de charger les dossiers.",
	displaySelectMissingLayout:
		"La disposition de la sélection est manquante.",
	displaySelectMissingBindings:
		"Les liaisons de la sélection sont manquantes.",
	displaySelectMissingSelectAction:
		"L'action de sélection est manquante.",
	displaySelectShowingResult:
		"Affichage de {visible} fiches sur {filtered} correspondances ({total} au total).",
	displaySelectFilters: "Filtres",
	displaySelectClearFilters: "Effacer les filtres",
	displaySelectNoMatches:
		"Aucun dossier ne correspond aux filtres actuels.",
	displaySelectShowAllRemaining: "Tout afficher ({count} restantes)",

	// Loading
	loadingFolders: "Chargement des dossiers",
	loadingView: "Votre vue se charge",
	loadingDocument: "Chargement du document…",
	selectDocumentToStart: "Sélectionnez un document pour commencer",

	// Document viewer
	viewerDate: "Date",
	viewerExpires: "Échéance",
	viewerEditMeta: "Éditer les métadonnées",
	viewerEditMetadata: "Éditer les métadonnées",
	viewerMetaName: "Nom *",
	viewerMetaDate: "Date *",
	viewerMetaExpires: "Échéance",
	viewerMetaApply: "Appliquer",
	viewerChangeStatus: "Changer le statut",
	viewerFile: "Fichier",
	viewerReplaceFile: "Remplacer le fichier",
	viewerCancel: "Annuler",
	viewerZoom: "Zoom",
	viewerAddPage: "Ajouter une page",
	viewerZoomIn: "Zoomer",
	viewerZoomOut: "Dézoomer",
	viewerFitWidth: "Ajuster à la largeur",
	viewerFitHeight: "Ajuster à la hauteur",
	viewerRotateClockwise: "Rotation horaire",
	viewerRotateAnticlockwise: "Rotation antihoraire",
	viewerCopyPage: "Copier la page {page}",
	viewerDeletePage: "Supprimer la page {page}",
	viewerRotatePageClockwise:
		"Tourner la page {page} dans le sens horaire",
	viewerRotatePageAnticlockwise:
		"Tourner la page {page} dans le sens antihoraire",
	viewerTextDocument: "Document texte",
	viewerUnsupportedType: "Type de document non pris en charge",
	viewerStatus: "Statut",

	// Email
	emailTitle: "Envoyer le document par courriel",
	emailRejectTitle: "Rejeter le document et envoyer un courriel",
	emailRejectSubmit: "Rejeter",
	emailFrom: "Expéditeur *",
	emailTo: "Destinataires *",
	emailCc: "Copie",
	emailBcc: "Copie masquée",
	emailSubject: "Objet *",
	emailMessage: "Message *",
	emailBody: "Message",
	emailSend: "Envoyer",
	emailDismiss: "Fermer",
	emailRejectionReason: "Motif du rejet",
	emailViewerFrom: "Expéditeur :",
	emailViewerTo: "Destinataires :",
	emailFailedToLoad: "Échec du chargement du fichier .msg.",
	emailFailedToReplaceFile: "Échec du remplacement du fichier",
	emailFailedToSend: "Échec de l'envoi du courriel",
	emailFailedToReject: "Échec du rejet du document",

	// Document actions (viewer & sidebar)
	actionSave: "Enregistrer",
	actionUpload: "Charger",
	actionDownload: "Télécharger",
	actionEmail: "Courriel",
	actionCopy: "Copier",
	actionPaste: "Coller",
	actionPending: "En attente",
	actionValidate: "Valider",
	actionReject: "Rejeter",
	actionRemove: "Supprimer",
	actionDelete: "Effacer",

	// Status (XPRM FLD_* codes + document states)
	statusPending: "En attente",
	statusValidated: "Validé",
	statusRejected: "Rejeté",
	statusRemoved: "Supprimé",
	statusOngoing: "En cours",
	statusPlanning: "Prévisionnel",
	statusNotApplicable: "Non applicable",
	statusUnknown: "Inconnu",

	// Dialogs & alerts
	alertImportAsPdf:
		"Importer \"{name}\" en PDF ?\n\nAppuyez sur OK pour convertir en PDF.\nAppuyez sur Annuler pour conserver le format d'image d'origine.",
	alertReplaceFileChoice:
		"Appuyez sur OK pour remplacer le fichier actuel.\nAppuyez sur Annuler pour ajouter le document du presse-papiers comme nouvelles pages au PDF actuel.",
	alertReplaceFileConfirm:
		"Ceci remplacera le fichier actuel. Voulez-vous continuer ?",
	alertMonoDocumentRedirect:
		'Un document existe déjà dans la nature mono-document "{nature}". Vous serez redirigé vers celui-ci.',
	alertDuplicateFailed: "Impossible de dupliquer ce document.",

	// Status codes (XDOC STATE 1..5)
	statusUploaded: "Téléversé",
};

const de: LocalMessageMap = {
	// Header
	headerFolders: "Ordner",
	headerSwitchTheme: "Design wechseln",
	headerReload: "Neu laden",

	// Sidebar
	sidebarFilters: "Filter",
	sidebarMandatoryOnly: "Nur Pflichtfelder",
	sidebarAll: "Alle",
	sidebarUnsavedDocuments: "Nicht gespeicherte Dokumente",
	sidebarLoading: "Laden...",

	// Unsaved documents badges
	sidebarBadgeUnsavedChanges: "nicht gespeicherte Änderungen",
	sidebarBadgeNotUploaded: "noch nicht hochgeladenes Dokument",

	// Create document dialog
	createDocumentTitle: "Ein Dokument hinzufügen",
	createDocumentExisting: "Ein existentes Dokument hinzufügen",
	createDocumentDocumentName: "Dokumentenname :",
	createDocumentDocumentNamePlaceholder: "z. B., MNR",
	createDocumentNoResultNatureContext:
		"Kontext der Natur wird geladen...",
	createDocumentNoCompatibleDocuments:
		"Keine kompatiblen Dokumente gefunden",
	createDocumentNoResults: "Keine Ergebnisse gefunden",
	createDocumentOr: "oder",
	createDocumentFromDisk: "Von der Festplatte hinzufügen",
	createDocumentChooseFile: "Datei auswählen",
	createDocumentConfirm: "Bestätigen",
	createDocumentFilesSelected: "{count} Dateien ausgewählt",

	// Display select
	displaySelectTitle: "Auswahl des Ordners",
	displaySelectManualTitle: "Manuelle Auswahl eines Ordners",
	displaySelectFolderName: "Ordnername",
	displaySelectFolderNumber: "Nummer der Akte",
	displaySelectLoadFolder: "Ordner laden",
	displaySelectFolderNameRequired: "Der Ordnername ist erforderlich.",
	displaySelectFolderNumberRequired:
		"Die Aktennummer ist erforderlich.",
	displaySelectLoading: "Ordner werden geladen...",
	displaySelectLoadError: "Ordner konnten nicht geladen werden.",
	displaySelectInvalidConfiguration:
		"Die Konfiguration zur Ordnerauswahl ist ungültig.",
	displaySelectRequestFailed: "Ordner konnten nicht geladen werden.",
	displaySelectValidationFailed:
		"Das Ergebnis der Ordnerauswahl ist ungültig.",
	displaySelectLoadFailed: "Ordner konnten nicht geladen werden.",
	displaySelectMissingLayout: "Das Layout der Auswahl fehlt.",
	displaySelectMissingBindings: "Die Bindungen der Auswahl fehlen.",
	displaySelectMissingSelectAction: "Die Auswahlaktion fehlt.",
	displaySelectShowingResult:
		"Anzeige von {visible} von {filtered} passenden Ordnern ({total} gesamt).",
	displaySelectFilters: "Filter",
	displaySelectClearFilters: "Filter löschen",
	displaySelectNoMatches:
		"Kein Ordner entspricht den aktuellen Filtern.",
	displaySelectShowAllRemaining: "Alle anzeigen ({count} verbleibend)",

	// Loading
	loadingFolders: "Ordner laden",
	loadingView: "Ihre Ansicht wird geladen",
	loadingDocument: "Dokument wird geladen…",
	selectDocumentToStart: "Wählen Sie ein Dokument aus, um zu starten",

	// Document viewer
	viewerDate: "Datum",
	viewerExpires: "Fälligkeit",
	viewerEditMeta: "Metadaten bearbeiten",
	viewerEditMetadata: "Metadaten bearbeiten",
	viewerMetaName: "Name *",
	viewerMetaDate: "Datum *",
	viewerMetaExpires: "Fälligkeit",
	viewerMetaApply: "Anwenden",
	viewerChangeStatus: "Status ändern",
	viewerFile: "Datei",
	viewerReplaceFile: "Datei ersetzen",
	viewerCancel: "Abbrechen",
	viewerZoom: "Zoom",
	viewerAddPage: "Seite hinzufügen",
	viewerZoomIn: "Vergrößern",
	viewerZoomOut: "Verkleinern",
	viewerFitWidth: "An Breite anpassen",
	viewerFitHeight: "An Höhe anpassen",
	viewerRotateClockwise: "Im Uhrzeigersinn drehen",
	viewerRotateAnticlockwise: "Gegen den Uhrzeigersinn drehen",
	viewerCopyPage: "Seite {page} kopieren",
	viewerDeletePage: "Seite {page} löschen",
	viewerRotatePageClockwise: "Seite {page} im Uhrzeigersinn drehen",
	viewerRotatePageAnticlockwise:
		"Seite {page} gegen den Uhrzeigersinn drehen",
	viewerTextDocument: "Textdokument",
	viewerUnsupportedType: "Nicht unterstützter Dokumenttyp",
	viewerStatus: "Status",

	// Email
	emailTitle: "Dokument per E-Mail senden",
	emailRejectTitle: "Dokument ablehnen und E-Mail senden",
	emailRejectSubmit: "Ablehnen",
	emailFrom: "Absender *",
	emailTo: "Empfänger *",
	emailCc: "CC",
	emailBcc: "BCC",
	emailSubject: "Betreff *",
	emailMessage: "Nachricht *",
	emailBody: "Nachricht",
	emailSend: "Senden",
	emailDismiss: "Schließen",
	emailRejectionReason: "Ablehnungsgrund",
	emailViewerFrom: "Von:",
	emailViewerTo: "An:",
	emailFailedToLoad: "Fehler beim Laden der .msg-Datei.",
	emailFailedToReplaceFile: "Die Datei konnte nicht ersetzt werden",
	emailFailedToSend: "Die E-Mail konnte nicht gesendet werden",
	emailFailedToReject: "Das Dokument konnte nicht abgelehnt werden",

	// Document actions (viewer & sidebar)
	actionSave: "Speichern",
	actionUpload: "Hochladen",
	actionDownload: "Herunterladen",
	actionEmail: "E-Mail",
	actionCopy: "Kopieren",
	actionPaste: "Einfügen",
	actionPending: "Ausstehend",
	actionValidate: "Genehmigen",
	actionReject: "Ablehnen",
	actionRemove: "Entfernen",
	actionDelete: "Löschen",

	// Status (XPRM FLD_* codes + document states)
	statusPending: "Ausstehend",
	statusValidated: "Validiert",
	statusRejected: "Abgelehnt",
	statusRemoved: "Entfernt",
	statusOngoing: "In Arbeit",
	statusPlanning: "Geplant",
	statusNotApplicable: "Nicht zutreffend",
	statusUnknown: "Unbekannt",

	// Dialogs & alerts
	alertImportAsPdf:
		'"{name}" als PDF importieren?\n\nDrücken Sie OK, um in PDF zu konvertieren.\nDrücken Sie Abbrechen, um das ursprüngliche Bildformat zu behalten.',
	alertReplaceFileChoice:
		"Drücken Sie OK, um die aktuelle Datei zu ersetzen.\nDrücken Sie Abbrechen, um das Zwischenablage-Dokument als neue Seiten zum aktuellen PDF hinzuzufügen.",
	alertReplaceFileConfirm:
		"Dies wird die aktuelle Datei ersetzen. Möchten Sie fortfahren?",
	alertMonoDocumentRedirect:
		'Ein Dokument existiert bereits in der Ein-Dokumenten-Natur "{nature}". Sie werden dorthin weitergeleitet.',
	alertDuplicateFailed:
		"Dieses Dokument konnte nicht dupliziert werden.",

	// Status codes (XDOC STATE 1..5)
	statusUploaded: "Hochgeladen",
};

export type TranslationKey = keyof typeof en;

export const localMessages: Readonly<
	Record<SupportedLocale, LocalMessageMap>
> = { en, fr, de };
