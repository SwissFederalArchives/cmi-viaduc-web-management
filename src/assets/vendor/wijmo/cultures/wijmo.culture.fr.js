﻿/*
    *
    * Wijmo Library 5.20173.380
    * http://wijmo.com/
    *
    * Copyright(c) GrapeCity, Inc.  All rights reserved.
    *
    * Licensed under the GrapeCity Commercial License.
    * sales@wijmo.com
    * wijmo.com/products/wijmo-5/license/
    *
    */
/*
 * Wijmo culture file: fr (French)
 */
var wijmo;
(function (wijmo) {
	wijmo.culture = {
		Globalize: {
			name: 'fr',
			displayName: 'French',
			numberFormat: {
				'.': ',',
				',': ' ',
				percent: {pattern: ['-n %', 'n %']},
				currency: {decimals: 2, symbol: '€', pattern: ['-n $', 'n $']}
			},
			calendar: {
				'/': '/',
				':': ':',
				firstDay: 1,
				days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
				daysAbbr: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
				months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
				monthsAbbr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
				am: ['', ''],
				pm: ['', ''],
				eras: ['ap. J.-C.'],
				patterns: {
					d: 'dd/MM/yyyy', D: 'dddd d MMMM yyyy',
					f: 'dddd d MMMM yyyy HH:mm', F: 'dddd d MMMM yyyy HH:mm:ss',
					t: 'HH:mm', T: 'HH:mm:ss',
					m: 'd MMMM', M: 'd MMMM',
					y: 'MMMM yyyy', Y: 'MMMM yyyy',
					g: 'dd/MM/yyyy HH:mm', G: 'dd/MM/yyyy HH:mm:ss',
					s: 'yyyy"-"MM"-"dd"T"HH":"mm":"ss'
				},
			}
		},
		MultiSelect: {
			itemsSelected: '{count:n0} articles sélectionnés',
			selectAll: 'Sélectionner tout'
		},
		FlexGrid: {
			groupHeaderFormat: '{name} : <b>{value}</b> ({count:n0} articles)'
		},
		FlexGridFilter: {
			// filter
			ascending: '\u2191 Ascendant',
			descending: '\u2193 Descendant',
			apply: 'Appliquer',
			cancel: 'Annuler',
			clear: 'Effacer',
			conditions: 'Filtrer par condition',
			values: 'Filtrer par valeur',
			// value filter
			search: 'Chercher',
			selectAll: 'Sélectionner tout',
			null: '(rien)',
			// condition filter
			header: 'Afficher les articles avec la valeur',
			and: 'Et',
			or: 'Ou',
			stringOperators: [
				{name: '(non défini)', op: null},
				{name: 'Est égal à', op: 0},
				{name: 'N\'est pas égal à', op: 1},
				{name: 'Commence par', op: 6},
				{name: 'Se termine par', op: 7},
				{name: 'Contient', op: 8},
				{name: 'Ne contient pas', op: 9}
			],
			numberOperators: [
				{name: '(non défini)', op: null},
				{name: 'Est égal à', op: 0},
				{name: 'N\'est pas égal à', op: 1},
				{name: 'Est supérieur à', op: 2},
				{name: 'Est supérieur ou égal à', op: 3},
				{name: 'Est inférieur à', op: 4},
				{name: 'Est inférieur ou égal à', op: 5}
			],
			dateOperators: [
				{name: '(non défini)', op: null},
				{name: 'Est égal à', op: 0},
				{name: 'Est avant', op: 4},
				{name: 'Est après', op: 2}
			],
			booleanOperators: [
				{name: '(non défini)', op: null},
				{name: 'Est égal à', op: 0},
				{name: 'N\'est pas égal à', op: 1}
			]
		},
		olap: {
			PivotFieldEditor: {
				dialogHeader: 'Paramètres de champ:',
				header: 'En-tête:',
				summary: 'Résumé:',
				showAs: 'Afficher le statut:',
				weighBy: 'Poids par:',
				sort: 'Tri par:',
				filter: 'Filtre:',
				format: 'Mise en forme:',
				sample: 'Aperçu:',
				edit: 'Edit…',
				clear: 'Effacer',
				ok: 'OK',
				cancel: 'Annuler',
				none: '(néant)',
				sorts: {
					asc: 'Ascendant',
					desc: 'Descendant'
				},
				aggs: {
					sum: 'Somme',
					cnt: 'Nombre',
					avg: 'Moyenne',
					max: 'Max',
					min: 'Min',
					rng: 'Plage',
					std: 'Écartype',
					var: 'Var',
					stdp: 'StdDevPop',
					varp: 'VarPop',
					first: 'Premier',
					last: 'Dernier'
				},
				calcs: {
					noCalc: 'Aucun calcul',
					dRow: 'Différence du rang précédent',
					dRowPct: 'Pourcentage de différence du rang précédent',
					dCol: 'Différence de la colonne précédente',
					dColPct: 'Pourcentage de différence de la colonne précédente',
					dPctGrand: '% du total général',
					dPctRow: '% du total de ligne',
					dPctCol: '% de colonne total',
					dRunTot: 'Total cumulé',
					dRunTotPct: '% total cumulé'
				},
				formats: {
					n0: 'Entier (n0)',
					n2: 'Décimal (n2)',
					c: 'Monnaie (c)',
					p0: 'Pourcentage (p0)',
					p2: 'Pourcentage (p2)',
					n2c: 'Des milliers (n2,)',
					n2cc: 'Des millions (n2,,)',
					n2ccc: 'Des milliards (n2,,,)',
					d: 'Date (d)',
					MMMMddyyyy: 'Mois jour année (MMMM dd, yyyy)',
					dMyy: 'Jour mois année (d/M/yy)',
					ddMyy: 'Jour mois année (dd/M/yy)',
					dMyyyy: 'Jour mois année (dd/M/yyyy)',
					MMMyyyy: 'Mois année (MMM yyyy)',
					MMMMyyyy: 'Mois année (MMMM yyyy)',
					yyyyQq: 'Trimestre de l’année (yyyy "Q"q)',
					FYEEEEQU: 'Trimestre de l’exercice ("FY" EEEE "Q"U)'
				}
			},
			PivotEngine: {
				grandTotal: 'Total général',
				subTotal: 'Sous-total'
			},
			PivotPanel: {
				fields: 'Choisissez les champs à ajouter au rapport:',
				drag: 'Faites glisser les champs dans les zones voulues ci-dessous:',
				filters: 'Filtres',
				cols: 'Colonnes',
				rows: 'Lignes',
				vals: 'Valeurs',
				defer: 'Reporter les mises à jour',
				update: 'Mettre à jour'
			},
			_ListContextMenu: {
				up: 'Monter',
				down: 'Descendre',
				first: 'Déplacer au début',
				last: 'Déplacer à la fin',
				filter: 'Déplacer dans la zone Filtre du rapport',
				rows: 'Déplacer dans la zone Étiquettes de lignes',
				cols: 'Déplacer dans la zone Étiquettes de colonnes',
				vals: 'Déplacer dans la zone Valeurs',
				remove: 'Supprimer le champ',
				edit: 'Paramètres de champ…',
				detail: 'Afficher le détail…'
			},
			PivotChart: {
				by: 'par',
				and: 'et'
			},
			DetailDialog: {
				header: 'Vue de détail:',
				ok: 'OK',
				items: 'éléments de {cnt:n0}',
				item: 'élément de {cnt}',
				row: 'Ligne',
				col: 'Colonne'
			}
		},
		Viewer: {
			cancel: 'Annuler',
			ok: 'OK',
			bottom: 'Bas:',
			top: 'Haut:',
			right: 'Droite:',
			left: 'Gauche:',
			margins: 'Marges (pouces)',
			orientation: 'Orientation:',
			paperKind: 'Type de papier:',
			pageSetup: 'Mise en page',
			landscape: 'Paysage',
			portrait: 'Portrait',
			pageNumber: 'Numéro de page',
			zoomFactor: 'Facteur de zoom',
			paginated: 'Mode Page',
			print: 'Impression',
			search: 'Chercher',
			matchCase: 'Respecter la casse',
			wholeWord: 'Mot entier uniquement',
			searchResults: 'Résultats de la recherche',
			previousPage: 'Page précédente',
			nextPage: 'Page suivante',
			firstPage: 'Première page',
			lastPage: 'Dernière page',
			backwardHistory: 'Précédent',
			forwardHistory: 'Transférer',
			pageCount: 'Nombre de pages',
			selectTool: 'Sélectionnez l’outil',
			moveTool: 'Outil de déplacement',
			continuousMode: 'Affichage de la Page continue',
			singleMode: 'Affichage de Page simple',
			wholePage: 'Toute forme de la Page',
			pageWidth: 'Largeur de la Page',
			zoomOut: 'Rétrécir',
			zoomIn: 'Effectuez un zoom avant',
			rubberbandTool: 'Zoom par sélection',
			magnifierTool: 'Loupe',
			rotatePage: 'Faire pivoter la page',
			rotateDocument: 'Faire pivoter le document',
			exports: 'Exporter',
			fullScreen: 'Plein écran',
			exitFullScreen: 'Quitter le mode plein écran',
			hamburgerMenu: 'Outils',
			showSearchBar: 'Afficher la barre de recherche',
			viewMenu: 'Options de disposition',
			searchOptions: 'Options de recherche',
			matchCaseMenuItem: 'Respecter la casse',
			wholeWordMenuItem: 'Mot entier',
			thumbnails: 'Vignettes de page',
			outlines: 'Explorateur de documents',
			loading: 'Chargement…',
			pdfExportName: 'Adobe PDF',
			docxExportName: 'Open XML Word',
			xlsxExportName: 'Open XML Excel',
			docExportName: 'Microsoft Word',
			xlsExportName: 'Microsoft Excel',
			mhtmlExportName: 'Archive Web (MHTML)',
			htmlExportName: 'Document HTML',
			rtfExportName: 'Document RTF',
			metafileExportName: 'Métafichiers compressés',
			csvExportName: 'CSV',
			tiffExportName: 'Images TIFF',
			bmpExportName: 'Images BMP',
			emfExportName: 'Métafichier amélioré',
			gifExportName: 'Images GIF',
			jpgExportName: 'Images JPEG',
			jpegExportName: 'Images JPEG',
			pngExportName: 'Images PNG',
			abstractMethodException: 'Il s’agit d’une méthode abstraite, s’il vous plaît mettre en œuvre.',
			cannotRenderPageNoViewPage: 'Ne peut pas rendre la page sans la source du document et page d’affichage.',
			cannotRenderPageNoDoc: 'Ne peut pas rendre la page sans la source du document et page d’affichage.',
			exportFormat: 'Format d\'exportation :',
			exportOptionTitle: 'Options d\'exportation',
			documentRestrictionsGroup: 'Restrictions de document',
			passwordSecurityGroup: 'Sécurité des mots de passe',
			outputRangeGroup: 'Gamme de sortie',
			documentInfoGroup: 'Document info',
			generalGroup: 'Général',
			docInfoTitle: 'Intitulé',
			docInfoAuthor: 'Auteur',
			docInfoManager: 'Responsable',
			docInfoOperator: 'Opérateur',
			docInfoCompany: 'Société',
			docInfoSubject: 'Objet',
			docInfoComment: 'Commentaire',
			docInfoCreator: 'Créateur',
			docInfoProducer: 'Producteur',
			docInfoCreationTime: 'Date/Heure de création',
			docInfoRevisionTime: 'Temps de révision',
			docInfoKeywords: 'Mots clés',
			embedFonts: 'Incorporer les polices TrueType',
			pdfACompatible: 'Compatible PDF/A (niveau 2 b)',
			useCompression: 'Utiliser la compression',
			useOutlines: 'Générer des contours',
			allowCopyContent: 'Autoriser la copie de contenu ou l’extraction',
			allowEditAnnotations: 'Autoriser la modification d’annotation',
			allowEditContent: 'Autoriser la modification des contenus',
			allowPrint: 'Autoriser l’impression',
			ownerPassword: 'Mot de passe autorisations (propriétaire) :',
			userPassword: 'Mot de passe document ouvert (utilisateur) :',
			encryptionType: 'Niveau de cryptage :',
			paged: 'Paginée',
			showNavigator: 'Afficher le navigateur',
			navigatorPosition: 'Position du navigateur',
			singleFile: 'Fichier unique',
			tolerance: 'La tolérance lors de la détection de texte délimite (points) :',
			pictureLayer: 'Utiliser la couche photo séparé',
			metafileType: 'Type de métafichier :',
			monochrome: 'Monochrome',
			resolution: 'Résolution :',
			outputRange: 'Étendue de pages :',
			outputRangeInverted: 'Inversé',
			showZoomBar: 'Barre de zoom',
			searchPrev: 'Rechercher précédent',
			searchNext: 'Rechercher suivant',
			checkMark: '\u2713',
			exportOk: 'Exporter…',
			cannotSearch: 'La recherche nécessite une source de document à spécifier.',
			parameters: 'Paramètres',
			requiringParameters: 'Entrer des paramètres.',
			nullParameterError: 'La valeur ne peut pas être null.',
			invalidParameterError: 'Entrée non valide.',
			parameterNoneItemsSelected: '(néant)',
			parameterAllItemsSelected: '(tous)',
			parameterSelectAllItemText: '(Sélectionner tout)',
			selectParameterValue: '(sélectionnez valeur)',
			apply: 'Appliquer',
			errorOccured: 'Une erreur s\'est produite.'
		}
	};
	var updc = window['wijmo']._updateCulture;
	if (updc) {
		updc();
	}
})(wijmo || (wijmo = {}));


