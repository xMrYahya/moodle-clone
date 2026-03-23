### Contrat CO29 - Selectionner Cours (Étudiant)
---
**Opération:selectionnerCours(idCours:String)**  
**Références croisées:**
- CU08 Passer questionnaire
- DSS Passer un questionnaire 

**Préconditions:**
- L'étudiant est authentifié

**PostConditions:**
- Aucune post condition (La liste des questionnaires du cours est affiché)

### Contrat CO30 - Répondre a une Question Choix Multiple
---
**Opération:repondreQuestionChoixMultiple(reponse:String, nomQuestion:String)**  
**Références croisées:**
- CU08 Passer questionnaire
- DSS Passer un questionnaire

**Préconditions:**
- L'étudiant a commencé a répondre a un questionnaire

**PostConditions:**
- la reponse reponseEtudiant est associé avec la question ayant le nom nomQuestion 