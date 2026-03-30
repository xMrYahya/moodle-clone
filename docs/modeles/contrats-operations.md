
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
ajouterQuestionVraiFaux(nom : String, enonce : String, reponse : bool, retroactionValide : String, retroactionInvalide : String, tags : String[]) : void

**Références croisées:**  
CU02a – Ajouter question  
DSS – Ajouter une question  
MDD – Question, Cours, Tags  

**Préconditions:**  
- L'Enseignant est authentifié.
- Un cours courant est sélectionné.
- Le nom de la question n'existe pas déjà dans la banque de questions du cours courant.

**PostConditions:**  
- Une instance `qvf` de `QuestionVraiFaux` a été créée.  
- `qvf.nom` a reçu la valeur `nom`.  
- `qvf.enonce` a reçu la valeur `enonce`.  
- `qvf.reponse` a reçu la valeur `reponse`.  
- `qvf.retroactionValide` a reçu la valeur `retroactionValide`.  
- `qvf.retroactionInvalide` a reçu la valeur `retroactionInvalide`.  
- Pour chaque élément `tagNom` du paramètre `tags`: une instance `tag` de `Tag` a été créée ou récupérée avec `tag.nom` = `tagNom`.
- `qvf` a été associée à chaque `tag` via l'association *appartient-à*.
- `qvf` a été associée au `Cours` courant via l’association *contient*.


### Contrat CO09 - Ajouter une question d'autre type
---
**Opération:**
ajouterQuestionAutreType(nom: String, enonce: String, type: String, retroactionValide: String, retroactionInvalide: String, tags: String[])

**Références croisées:**
CU02a - Ajouter question
DSS - Ajoute une question
MDD - Question, Cours, Tags

**Préconditions:**
- L'Enseignant est authentifié
- Un cours courant est sélectionné.  
- Le nom de la question n'existe pas déjà dans la banque de questions du cours courant.
- Le type de question est l'un des types supportés (VraiFaux, ChoixMultiple, ReponseCourte, Numerique, MiseEnCorrespondance, Essai).

**Postconditions:**
- Une instance `q` de `Question` a été créée avec le type spécifié.
- `q.nom` a reçu la valeur `nom`.
- `q.enonce` a reçu la valeur `enonce`.
- `q.retroactionValide` a reçu la valeur `retroactionValide`.
- `q.retroactionInvalide` a reçu la valeur `retroactionInvalide`.
- `q` a été associée au `Cours` courant via l'association *contient*.
- Pour chaque élément `tagNom` du paramètre `tags`: une instance `tag` de `Tag` a été créée ou récupérée avec `tag.nom` = `tagNom`.
- `q` a été associée à chaque `tag` via l'association *appartient-à*.
- Les données spécifiques au type (réponse, choix multiples, paires, etc.) ont été stockées selon le type.

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
**Opération: supprimerQuestion(groupId : String, nom : String)**
**Références croisées:**
- CU02d - Supprimer une question
- MDD - Enseignant, Cours, Question
- DSS - Supprimer question
**Préconditions:**
- L'enseignant est authentifié.
- Un cours courant est sélectionné.
- Une question avec le nom `nom` existe dans le cours.

**PostConditions:**
- Aucune modification d'état du système à cette étape.
- Les détails de la question sont retournés à l'acteur pour confirmation.

### Contrat C013 - Confirmation de suppression de question
---
**Opération: confirmerSuppression(groupId : String, nom : String)**
**Références croisées:**
- CU02d - Supprimer une question
- MDD - Enseignant, Cours, Question, Tags
- DSS - Supprimer question
**Préconditions:**
- L'enseignant est authentifié.
- Une demande de suppression est en cours pour une question.
- La question n'est pas actuellement utilisée dans un questionnaire actif.

**PostConditions:**
- L'instance `q` de `Question` avec le nom `nom` a été supprimée du `Cours` courant.
- Toutes les associations entre `q` et les instances `Tag` via l'association *appartient-à* ont été supprimées.
- La nouvelle liste de questions du cours est retournée à l'acteur.
- Si la question est utilisée dans un questionnaire: aucune suppression ne s'effectue et une erreur est retournée.

### Contrat C014a - Modifier une question vrai/faux
---
**Opération: modifierQuestion(nomOriginal : String, type : String, nom : String, enonce : String, reponse : bool, retroactionValide : String, retroactionInvalide : String, tags : String[])**
**Références croisées:**
- CU02c - Modifier une question
- RDCU - Modifier une question vrai/faux
- DSS - Modifier une question
- MDD - Enseignant, Cours, Question, Tags
**Préconditions:**
- L'enseignant est authentifié.
- Un cours courant est sélectionné.
- Une question avec le nom `nomOriginal` existe dans le cours.
- Le paramètre `type` vaut `VraiFaux`.
- Le nouveau nom `nom` n'existe pas déjà dans la banque de questions du cours (sauf s'il est identique à `nomOriginal`).
- La valeur `reponse` est booléenne.

**PostConditions:**
- Une instance `q` de `QuestionVraiFaux` a remplacé la question identifiée par `nomOriginal` dans le `Cours` courant.
- `q.nom` a reçu la valeur `nom`.
- `q.enonce` a reçu la valeur `enonce`.
- `q.reponse` a reçu la valeur `reponse`.
- `q.retroactionValide` a reçu la valeur `retroactionValide`.
- `q.retroactionInvalide` a reçu la valeur `retroactionInvalide`.
- `q` a été associée au `Cours` courant via l'association *contient*.
- Les associations de `q` avec les `Tag` ont été mises à jour selon le paramètre `tags`.

### Contrat C014b - Modifier une question choix multiple
---
**Opération: modifierQuestion(nomOriginal : String, type : String, nom : String, enonce : String, reponses : ReponseChoixMultiple[], seulementUnChoix : bool, retroactionValide : String, retroactionInvalide : String, tags : String[])**
**Références croisées:**
- CU02c - Modifier une question
- RDCU - Modifier une question choix multiple
- DSS - Modifier une question
- MDD - Enseignant, Cours, Question, Tags
**Préconditions:**
- L'enseignant est authentifié.
- Un cours courant est sélectionné.
- Une question avec le nom `nomOriginal` existe dans le cours.
- Le paramètre `type` vaut `ChoixMultiple`.
- Le nouveau nom `nom` n'existe pas déjà dans la banque de questions du cours (sauf s'il est identique à `nomOriginal`).
- Le paramètre `reponses` contient au moins une réponse.

**PostConditions:**
- Une instance `q` de `QuestionChoixMultiple` a remplacé la question identifiée par `nomOriginal` dans le `Cours` courant.
- `q.nom` a reçu la valeur `nom`.
- `q.enonce` a reçu la valeur `enonce`.
- `q.reponses` a reçu la valeur `reponses`.
- `q.seulementUnChoix` a reçu la valeur `seulementUnChoix`.
- `q.retroactionValide` a reçu la valeur `retroactionValide`.
- `q.retroactionInvalide` a reçu la valeur `retroactionInvalide`.
- `q` a été associée au `Cours` courant via l'association *contient*.
- Les associations de `q` avec les `Tag` ont été mises à jour selon le paramètre `tags`.

### Contrat C014c - Modifier une question reponse courte
---
**Opération: modifierQuestion(nomOriginal : String, type : String, nom : String, enonce : String, reponse : String, retroactionValide : String, retroactionInvalide : String, tags : String[])**
**Références croisées:**
- CU02c - Modifier une question
- RDCU - Modifier une question reponse courte
- DSS - Modifier une question
- MDD - Enseignant, Cours, Question, Tags
**Préconditions:**
- L'enseignant est authentifié.
- Un cours courant est sélectionné.
- Une question avec le nom `nomOriginal` existe dans le cours.
- Le paramètre `type` vaut `ReponseCourte`.
- Le nouveau nom `nom` n'existe pas déjà dans la banque de questions du cours (sauf s'il est identique à `nomOriginal`).
- Le paramètre `reponse` n'est pas vide.

**PostConditions:**
- Une instance `q` de `QuestionReponseCourte` a remplacé la question identifiée par `nomOriginal` dans le `Cours` courant.
- `q.nom` a reçu la valeur `nom`.
- `q.enonce` a reçu la valeur `enonce`.
- `q.reponseAttendue` a reçu la valeur `reponse`.
- `q.retroactionValide` a reçu la valeur `retroactionValide`.
- `q.retroactionInvalide` a reçu la valeur `retroactionInvalide`.
- `q` a été associée au `Cours` courant via l'association *contient*.
- Les associations de `q` avec les `Tag` ont été mises à jour selon le paramètre `tags`.

### Contrat C014d - Modifier une question numerique
---
**Opération: modifierQuestion(nomOriginal : String, type : String, nom : String, enonce : String, reponse : number, retroactionValide : String, retroactionInvalide : String, tags : String[])**
**Références croisées:**
- CU02c - Modifier une question
- RDCU - Modifier une question numerique
- DSS - Modifier une question
- MDD - Enseignant, Cours, Question, Tags
**Préconditions:**
- L'enseignant est authentifié.
- Un cours courant est sélectionné.
- Une question avec le nom `nomOriginal` existe dans le cours.
- Le paramètre `type` vaut `Numerique`.
- Le nouveau nom `nom` n'existe pas déjà dans la banque de questions du cours (sauf s'il est identique à `nomOriginal`).
- Le paramètre `reponse` est une valeur numérique valide.

**PostConditions:**
- Une instance `q` de `QuestionNumerique` a remplacé la question identifiée par `nomOriginal` dans le `Cours` courant.
- `q.nom` a reçu la valeur `nom`.
- `q.enonce` a reçu la valeur `enonce`.
- `q.reponseAttendue` a reçu la valeur `reponse`.
- `q.retroactionValide` a reçu la valeur `retroactionValide`.
- `q.retroactionInvalide` a reçu la valeur `retroactionInvalide`.
- `q` a été associée au `Cours` courant via l'association *contient*.
- Les associations de `q` avec les `Tag` ont été mises à jour selon le paramètre `tags`.

### Contrat C014e - Modifier une question essai
---
**Opération: modifierQuestion(nomOriginal : String, type : String, nom : String, enonce : String, retroactionValide : String, retroactionInvalide : String, tags : String[])**
**Références croisées:**
- CU02c - Modifier une question
- RDCU - Modifier une question essai
- DSS - Modifier une question
- MDD - Enseignant, Cours, Question, Tags
**Préconditions:**
- L'enseignant est authentifié.
- Un cours courant est sélectionné.
- Une question avec le nom `nomOriginal` existe dans le cours.
- Le paramètre `type` vaut `Essai`.
- Le nouveau nom `nom` n'existe pas déjà dans la banque de questions du cours (sauf s'il est identique à `nomOriginal`).

**PostConditions:**
- Une instance `q` de `QuestionEssai` a remplacé la question identifiée par `nomOriginal` dans le `Cours` courant.
- `q.nom` a reçu la valeur `nom`.
- `q.enonce` a reçu la valeur `enonce`.
- `q.retroactionValide` a reçu la valeur `retroactionValide`.
- `q.retroactionInvalide` a reçu la valeur `retroactionInvalide`.
- `q` a été associée au `Cours` courant via l'association *contient*.
- Les associations de `q` avec les `Tag` ont été mises à jour selon le paramètre `tags`.

### Contrat C014f - Modifier une question mise en correspondance
---
**Opération: modifierQuestion(nomOriginal : String, type : String, nom : String, enonce : String, paires : PairDeCorrespondance[], retroactionValide : String, retroactionInvalide : String, tags : String[])**
**Références croisées:**
- CU02c - Modifier une question
- RDCU - Modifier une question mise en correspondance
- DSS - Modifier une question
- MDD - Enseignant, Cours, Question, Tags
**Préconditions:**
- L'enseignant est authentifié.
- Un cours courant est sélectionné.
- Une question avec le nom `nomOriginal` existe dans le cours.
- Le paramètre `type` vaut `MiseEnCorrespondance`.
- Le nouveau nom `nom` n'existe pas déjà dans la banque de questions du cours (sauf s'il est identique à `nomOriginal`).
- Le paramètre `paires` contient au moins une paire.

**PostConditions:**
- Une instance `q` de `QuestionMiseEnCorrespondance` a remplacé la question identifiée par `nomOriginal` dans le `Cours` courant.
- `q.nom` a reçu la valeur `nom`.
- `q.enonce` a reçu la valeur `enonce`.
- `q.paires` a reçu la valeur `paires`.
- `q.retroactionValide` a reçu la valeur `retroactionValide`.
- `q.retroactionInvalide` a reçu la valeur `retroactionInvalide`.
- `q` a été associée au `Cours` courant via l'association *contient*.
- Les associations de `q` avec les `Tag` ont été mises à jour selon le paramètre `tags`.

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