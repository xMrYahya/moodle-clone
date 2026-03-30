### Contrat CO29 - Consulter les questionnaires d'un cours
---
**Operation: selectionnerCours(idCours: String)**

**References croisees:**
- CU08 Passer questionnaire
- DSS Passer un questionnaire
- MDD Cours, Questionnaire

**Preconditions:**
- L'etudiant est authentifie.
- L'etudiant est inscrit au cours identifie par idCours.

**Postconditions:**
- Aucune.

### Contrat CO30 - Demarrer une tentative de questionnaire
---
**Operation: selectionnerQuestionnaire(nomQuestionnaire: String)**

**References croisees:**
- CU08 Passer questionnaire
- DSS Passer un questionnaire
- MDD Questionnaire, ReponseQuestionnaire

**Preconditions:**
- L'etudiant est authentifie.
- L'etudiant a selectionne un cours.
- Le questionnaire identifie par nomQuestionnaire appartient au cours selectionne.
- Le questionnaire identifie par nomQuestionnaire est actif.
- Le questionnaire identifie par nomQuestionnaire fait partie des questionnaires a completer de l'etudiant.

**Postconditions:**
- Une instance reponseQuestionnaire de ReponseQuestionnaire a ete creee.
- reponseQuestionnaire a ete associee au questionnaire selectionne.
- reponseQuestionnaire a ete associee a l'etudiant.

### Contrat CO31 - Enregistrer la reponse de l'etudiant
---
**Operation: repondreQuestionChoixMultiple(reponse: String)**

**References croisees:**
- CU08 Passer questionnaire
- DSS Passer un questionnaire
- MDD ReponseQuestionnaire, Question

**Preconditions:**
- L'etudiant a une instance reponseQuestionnaire en cours.
- La question courante du questionnaire en cours est une question de type choix multiple.

**Postconditions:**
- La reponse reponseEtudiant a ete ajoutee a reponseQuestionnaire.
- reponseQuestionnaire a ete mise a jour pour pointer la prochaine question, le cas echeant.