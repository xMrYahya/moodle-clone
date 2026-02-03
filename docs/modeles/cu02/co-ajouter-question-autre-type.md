### Contrat C02a - Ajouter une question autre type
---
**Opération:** `ajouterQuestionAutreType(nom: String, énoncé: String, type: String, rétroactionValide: String, rétroactionInvalide: String, tags: String[])`

**Références croisées:**
CU02a - Ajouter question
DSS - Ajoute une question
MDD - Questions, Cours

**Préconditions:**
- L'enseignant est authentifié
- Un cours courant est sélectionné.  
- Le nom de la question n’existe pas déjà dans la banque de questions du cours courant.

**Postconditions:**
- Une instance `q` de `Question` a été créée
- `q.nom` est devenu `nom`
- `q.énoncé` est devenu `énoncé`
- `q.type` est devenu `type` (attribut indiquant le type de question)
- `q.rétroactionValide` est devenu `rétroactionValide`
- `q.rétroactionInvalide` est devenu `rétroactionInvalide`
- `q` a été associée au `Cours` courant via l'association *contient*
- Pour chaque élément `t` dans `tags`, une instance de `tags` a été créée ou récupérée et associée à `q` via l'association *catégorisé par*
