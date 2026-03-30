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

**Notes d'implementation:**
- Le questionnaire peut contenir des questions de type: Vrai/Faux, Choix Multiple, Numerique, Reponse Courte, Mise en Correspondance, ou Essai.
- Les questions de type Essai ou Mise en Correspondance marquent le questionnaire comme contenant correction manuelle.
- Un questionnaire 100% Essai ne peut pas etre darre ; une correction manuelle est toujours requise.

### Contrat CO31 - Enregistrer la reponse de l'etudiant
---
**Operation: repondreQuestion(reponse: String | Number | Boolean)**

**References croisees:**
- CU08 Passer questionnaire
- DSS Passer un questionnaire
- MDD ReponseQuestionnaire, Question

**Preconditions:**
- L'etudiant a une instance reponseQuestionnaire en cours.
- La question courante du questionnaire en cours est une question quelconque (tous types acceptes).

**Postconditions:**
- La reponse reponseEtudiant a ete ajoutee a reponseQuestionnaire.
- reponseQuestionnaire a ete mise a jour pour pointer la prochaine question, le cas echeant.

**Notes d'implementation:**
- La validation et le format de la reponse dependent du type de question.
- Les types de reponse acceptes: String (ChoixMultiple, ReponseCourte, Essai, MiseEnCorrespondance), Number (Numerique), Boolean (VraiFaux).
- Les questions Essai et MiseEnCorrespondance ne genent pas de note automatique; elles necessitent une correction manuelle.
- Les questions VraiFaux, Numerique, ReponseCourte et ChoixMultiple genent automatiquement une note.