### Contrat C02a - Ajouter une question vrai/faux
---
**Opération:**  
`ajouterQuestionVraiFaux(nom : String, énoncé : String, vérité : Boolean, rétroactionVrai : String, rétroactionFaux : String) : void`

**Références croisées:**  
CU02a – Ajouter question  
DSS – Ajouter une question  
MDD – Question, Cours  

**Préconditions:**  
- L’enseignant.token est pas vide.  
- Un cours c sélectionné.

**PostConditions:**  
- Une instance `qvf` de `Question` a été créée.  
- `qvf.nom` est devenu `nom`.  
- `qvf.énoncé` est devenu `énoncé`.  
- `qvf.vérité` est devenu `vérité`.  
- `qvf.rétroactionValide` est devenu `rétroactionVrai`.  
- `qvf.rétroactionInvalide` est devenu `rétroactionFaux`.  
- `qvf` a été associée au `Cours` courant via l’association *contient*.


