
## Contrats
### Contrat CO01 - Démarrer Ajout Cours
---
**Opération:**
demarrerAjoutCours()

**Références croisées:**

**Préconditions:**
L'Enseignant doit être authentifié.
Le service SGB est accessible.

**PostConditions:**
L'Enseignant a été récupéré depuis le SGA la liste des groupes-cours.


### Contrat CO02 - Sélectionner Cours
---
**Opération:**
sélectionnerGroupeCours(idGroupe : String)

**Références croisées:**
Contrat CO01 - Démarrer Ajout Cours

**Préconditions:**
L'Enseignant est authentifié.
Un jeton d'authentification valide est présent dans la session.
La liste des groupes-cours assignés à l'Enseignant a été récupérée préalablement via demarrerAjoutCours()

**PostConditions:**
Une instance c : Cours a été créée.
c a été associée à l'Enseignant authentifié.
Les étudiants inscrit à ce groupe-cours étaient associés a c. 
Les informations du groupe-cours(horaire, local, etc.) ont étés enregistrées dans c.


### Contrat CO03 - Afficher la liste des cours
---
**Opération:**
afficherListeCours()

**Références croisées:**

**Préconditions:**
Une instance ens d'Enseignant existe.

**PostConditions:**


### Contrat CO04 - Afficher les détails d'un cours
---
**Opération:**
afficherDetailsCours(idCours: String)

**Références croisées:**

**Préconditions:** 
L'Enseignant a eu au moins un cours qui lui est assigné.

**PostConditions:** 

### Contrat CO05 - Retirer un cours
---
**Opération:**
retirerCours(idCours : String)

**Références croisées:**
Contrat CO03 - Afficher la liste des cours

**Préconditions:**
L'Enseignant est authentifié.
L'Enseignant a récupéré un cours (Cu01b)

**PostConditions:**
Le cours c a été associcé à idCours


### Contrat CO06 - Confirmation de la suppression d'un cours
---
**Opération:**
confirmerSuppressionCours()

**Références croisées:**
Contrat CO05 - Retirer un cours

**Préconditions:**
L'Enseignant est authentifié.
L'Enseignant a récupéré un cours (Cu01b)

**PostConditions:**
Le cours (et seulement ce cours) a été supprimé du système SGA


### Contrat CO07 - Gestion de Question
---
**Opération:**
gestionQuestions()

**Références croisées:**

**Préconditions:**
- Le token de l'Enseignant e.token n'est pas vide
- Un cours c est selectioné

**PostConditions:**


### Contrat CO08 - Ajouter une question vrai/faux
---
**Opération:**
ajouterQuestionVraiFaux(nom : String, énoncé : String, vérité : Boolean, rétroactionVrai : String, rétroactionFaux : String) : void

**Références croisées:**  
CU02a – Ajouter question  
DSS – Ajouter une question  
MDD – Question, Cours  

**Préconditions:**  
- L’Enseignant.token n'est pas vide.  
- Un cours c  est sélectionné.

**PostConditions:**  
- Une instance `qvf` de `Question` a été créée.  
- `qvf.nom` est devenu `nom`.  
- `qvf.énoncé` est devenu `énoncé`.  
- `qvf.vérité` est devenu `vérité`.  
- `qvf.rétroactionValide` est devenu `rétroactionVrai`.  
- `qvf.rétroactionInvalide` est devenu `rétroactionFaux`.  
- `qvf` a été associée au `Cours` courant via l’association *contient*.


### Contrat CO09 - Ajouter une question d'autre type
---
**Opération:**
ajouterQuestionAutreType(nom: String, énoncé: String, type: String, rétroactionValide: String, rétroactionInvalide: String, tags: String[])

**Références croisées:**
CU02a - Ajouter question
DSS - Ajoute une question
MDD - Questions, Cours

**Préconditions:**
- L'Enseignant est authentifié
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

### Contrat C010 - Afficher la liste de question d'un cours
---
**Opération: consulterQuestionsCours(groupId : String)**  
**Références croisées:**
- CU02b - Récuperer une question
- MDD - Enseignant, Cours, Question
- DSS - Récuperer Question
**Préconditions:**
- Un cours a été sélectionné

**PostConditions:**

### Contrat C011 - Afficher une question de la liste de question d'un cours
---
**Opération: selectionnerQuestionnaire(nom : String)**  
**Références croisées:**
- CU02b - Récuperer une question
- MDD - Enseignant, Cours, Question
- DSS - Récuperer Question
**Préconditions:**
- La liste de question d'un cours a été récupéré

**PostConditions:**
- Aucune post condition

### Contrat C012 - Demande de suppression de question
---
**Opération: supprimerQuestion(nom : String)**  
**Références croisées:**
- CU02d - Supprimer une question
- MDD - Enseignant, Cours, Question
- DSS - Supprimer question
**Préconditions:**
- Une liste de cours a été selectionné

**PostConditions:**
- Aucune post condition

### Contrat C013 - Confirmation de suppression de question
---
**Opération: confirmerSuppression()**  
**Références croisées:**
- CU02d - Supprimer une question
- MDD - Enseignant, Cours, Question
- DSS - Supprimer question
**Préconditions:**
- Une demande de suppression a été débuté pour un cours

**PostConditions:**
- La question de la selectionné a été dissocié du QuestionStore de la question selectionné

### Contrat C014 - Modification de question
---
**Opération: modifierQuestion(nom, enonce, type,retroactionValide, retroactionInvalide, tags)**  
**Références croisées:**
- CU02c - Modifier une question
- MDD - Enseignant, Cours, Question
- DSS - Modifier une question
**Préconditions:**
- Le nouveau nom de la question a modifier est valide
- Une question est sélectionné

**PostConditions:**
- nom a été associé dans Question.nom de la question sélectionné
- enonce a été associé dans Question.enonce de la question sélectionné
- type a été associé dans Question.type de la question sélectionné
- retroactionValide a été associé dans Question.retroactionValide de la question sélectionné
- retroactionInvalide a été associé dans Question.retroactionInvalide de la question sélectionné

### Contrat C015 - Gerer les questionnaires
---
**Opération: gererQuestionnaires()**  
**Références croisées:**
- CU05a - Ajouter un questionnaire
- MDD - Enseignant, Cours, Question
- DSS -Ajouter un questionnaire
**Préconditions:**
- Un cours est sélectionné

**PostConditions:**
- Aucune postCondition (les questionnaires sont seulement retourné par le controlleur)

### Contrat C016 - Ajouter un questionnaire
---
**Opération: ajouterQuestionnaire(nom:String, description:String, actif:boolean)**  
**Références croisées:**
- CU05a - Ajouter un questionnaire
- MDD - Enseignant, Cours, Question
- DSS -Ajouter un questionnaire
**Préconditions:**
- Un cours est sélectionné
- L'option ajouter Questionnaire a été selectionné

**PostConditions:**
- une instance q de questionnaire a été créé
- q a été associé au cours sélectionné
- nom a été assigné a q.nom
- description a été associé a q.description
- actif a été associé a q.actif

### Contrat C017 - Selectionner un tag
---
**Opération: selectionnerTag(nomTag:String)**  
**Références croisées:**
- CU05a - Ajouter un questionnaire
- MDD - Enseignant, Cours, Question
- DSS -Ajouter un questionnaire
**Préconditions:**
- Un tag a été selectionné

**PostConditions:**
- Une instance questionnaireTemp de Questionnaire a été crée

### Contrat C018 - Ajouter une question
---
**Opération: ajouterQuestion(nomQuestion:String)**  
**Références croisées:**
- CU05a - Ajouter un questionnaire
- MDD - Enseignant, Cours, Question
- DSS -Ajouter un questionnaire
**Préconditions:**
- Un questionnaire a été sélectionné

**PostConditions:**
- une question a été ajouté au questionnaireTemp avec la correspondance du nomQuestion

### Contrat C019 - Sauvegarder un questionnaire
---
**Opération: sauvegarderQuestionnaire()**  
**Références croisées:**
- CU05a - Ajouter un questionnaire
- MDD - Enseignant, Cours, Question
- DSS -Ajouter un questionnaire
**Préconditions:**
- Un questionnaire temporaire a été selectionné

**PostConditions:**
- une question a été ajouté au questionnaireTemp avec la correspondance du nomQuestion