# Schéma de `ecoles.json`

Ce fichier documente les champs de chaque école. Les champs marqués **optionnel**
n'ont pas besoin d'être présents partout : quand ils manquent, le site les ignore
proprement (pas de badge affiché, pas d'exclusion par erreur dans les filtres).

## Champs déjà en place

| Champ | Type | Exemple |
|---|---|---|
| `nom`, `sigle` | string | `"École Supérieure Polytechnique"`, `"ESP"` |
| `ville`, `région` | string | `"Dakar"`, `"Dakar"` |
| `domaine` | `"technologie"` \| `"creatif"` \| `"social"` \| `"gestion"` | |
| `type` | `"public"` \| `"privé"` | |
| `reconnuEtat` | boolean | `true` pour toutes les écoles publiques (reconnaissance de fait) ; sinon à vérifier école par école pour le privé |
| `niveauAccepte` | string[] | `["BFEM", "BT", "Après BAC"]` |
| `siteOfficiel`, `telephone`, `email`, `adresse` | string | |
| `secteurs`, `diplomes` | string[] | filières / diplômes délivrés |
| `implantation`, `groupeId`, `groupeNom` | — | pour les établissements multi-campus |

## Champs ajoutés (structure prête, données à vérifier)

| Champ | Type | Valeurs possibles | Affiché où |
|---|---|---|---|
| `budget` | string (une seule valeur) | `"moins_300k"`, `"300k_600k"`, `"600k_1m"`, `"plus_1m"` | Fiche école, comparateur, filtre "Budget" de l'annuaire |
| `modeApprentissage` | string[] | `"presentiel"`, `"distanciel"`, `"alternance"` (une école peut en avoir plusieurs) | Fiche école, comparateur, filtre "Mode d'apprentissage" |

### Exemple

```json
{
  "nom": "Institut Supérieur du Numérique",
  "budget": "300k_600k",
  "modeApprentissage": ["presentiel", "alternance"]
}
```

### ⚠️ Avant de remplir ces deux champs

Ce sont des informations factuelles qui engagent la confiance des étudiants
(frais réels, formule pédagogique réelle). Ne pas deviner ou extrapoler à partir
du type d'établissement : vérifier auprès du site officiel de l'école, d'une
brochure à jour, ou d'un contact direct, école par école. Un chiffre faux ici est
pire qu'une case vide — laisser le champ absent plutôt que d'inventer une valeur.
