/**
 * Liste des mots à cocainifier.
 * Pour en rajouter, veuillez respecter la syntaxe :
 *
 * "nom à chercher dans la page": {
 *    "regex": "expression regex pour trouver le nom",
 *    "replaceWith": "valeur de remplacement"
 * },
 *
 *
 * Référence pour écrire des expressions regex : https://developer.mozilla.org/fr/docs/Web/JavaScript/Guide/Regular_Expressions
 */
const cocaines = {
    ai: {
        regex: "(?<![A-Za-z0-9])ai(?![A-Za-z0-9])",
        replaceWith: "cocaine",
    },
    ia: {
        regex: "(?<![A-Za-z0-9])[iI][aA](?![A-Za-z0-9])",
        replaceWith: "cocaïne",
    },
    "l'ia": {
        regex: "(?<![A-Za-z0-9])[lL]'[iI][aA](?![A-Za-z0-9])",
        replaceWith: "la cocaïne",
    },
};

export default cocaines;
