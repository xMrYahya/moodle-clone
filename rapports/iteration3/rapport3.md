# Rapport Itération numéro 3

## Identification des membres de l'équipe

## Membre 1

- <nomComplet1>Ardy, Yahya</nomComplet1>
- <courriel1>yahya.ardy.1@ens.etsmtl.ca</courriel1>
- <codeMoodle1>AT73950</codeMoodle1>
- <githubAccount1>xMrYahya</githubAccount1>

## Membre 2

- <nomComplet2>Boulianne, Alex</nomComplet2>
- <courriel2>alex.boulianne.1@ens.etsmtl.ca</courriel2>
- <codeMoodle2>AT72810</codeMoodle2>
- <githubAccount2>c4tiki</githubAccount2>

## Membre 3

- <nomComplet3>Gamache, Alexandre</nomComplet3>
- <courriel3>alexandre.gamache.1@ens.etsmtl.ca</courriel3>
- <codeMoodle3>AU74150</codeMoodle3>
- <githubAccount3>AlexandreG17</githubAccount3>

## Membre 4

- <nomComplet4>Hoffmann, Raphaël</nomComplet4>
- <courriel4>raphael.hoffmann.1@ens.etsmtl.ca</courriel4>
- <codeMoodle4>AU65470</codeMoodle4>
- <githubAccount4>WishPib</githubAccount4>

## Membre 5

- <nomComplet5>Kandil, Kassem</nomComplet5>
- <courriel5>kassem.kandil.1@ens.etsmtl.ca</courriel5>
- <codeMoodle5>AU84220</codeMoodle5>
- <githubAccount5>kassem0303,kassem03-ets</githubAccount5>


## Exigences

| Nom / Description               | Assigné à (nom)     |
| --------------------------------| ------------------- |
| CU08a                            | (tous)              |
|   CU08a - conception             | Raphael + Alexandre |
|   CU08a - test et implémentation | Kassem + Yahya      |
|   CU08a - mise à jour des modèles| Alex                |


## Modèle du domaine (MDD)

![MDD ](../../docs/modeles/exports-it-3/MDD_SGB_SGA.png "MDD")


## Diagramme de séquence système (DSS)

![DSS Passer Questionnaire  ](../../docs/modeles/exports-it-3/dss-passer-questionnaire.png "DSS Passer Questionnaire")


## Contrats
### Contrat CO29 - Selectionner Cours (Étudiant)
---
**Opération:selectionnerCours(idCours:String)**  
**Références croisées:**
- CU08 Passer questionnaire
- DSS Passer un questionnaire 
- MDD Questionnaire, Cours

**Préconditions:**
- L'étudiant est authentifié

**PostConditions:**
- Aucune post condition (La liste des questionnaires du cours est affiché)

### Contrat CO30 - 
---
**Opération:selectionnerQuestionnaire(nomQuestionnaire:String)**
**Références croisées:**
- CU08 Passer questionnaire
- DSS Passer un questionnaire 
- MDD Questionnaire, Cours, RéponseQuestionnaire

**Préconditions:**
- L'étudiant a sélectionné un cours

**PostConditions:**
- une instance reponseQuestionnaire de réponseQuestionnaire a été crée
- L'instance a été associé avec le questionnaire qui a été selectionné

### Contrat CO31 - Répondre a une Question Choix Multiple
---
**Opération:repondreQuestionChoixMultiple(reponse:String, nomQuestion:String)**  
**Références croisées:**
- CU08 Passer questionnaire
- DSS Passer un questionnaire
- MDD ReponseQuestionnaire, Questionnaire, Question

**Préconditions:**
- L'étudiant a commencé a répondre a un questionnaire (un objet réponseQuestionnaire existe)

**PostConditions:**
- la reponse reponseEtudiant a été ajouté dans réponses a la position de la question actuelle.

## Réalisation de cas d'utilisation (RDCU)

![RDCU Selectionner Cours  ](../../docs/modeles/exports-it-3/rdcu-selectionner-cours.png "RDCU Selectionner Cours")

![RDCU Selectionner Questionnaire ](../../docs/modeles/exports-it-3/rdcu-selectionner-questionnaire.png "RDCU Selectionner Questionnaire")

![RDCU Repondre Question choix multiple ](../../docs/modeles/exports-it-3/rdcu-repondre-question-choix-multiple.png "Repondre Question choix multiple")

### Diagramme de classe TPLANT
- Générer un diagramme de classe avec l'outil TPLANT et commenter celui-ci par rapport à votre MDD.
- https://www.npmjs.com/package/tplant
  
## Retour sur la correction du rapport précédent

### DSS Mis a jour

![DSS Ajouter Question ](../../docs/modeles/exports/dss-ajouter-question-updt-v1.png "DSS Ajouter Question")

### Contrats Mis a jour 




### RDCUs Mis a jour
Ajouté 
![RDCU Ajouter question VF ](../../docs/modeles/exports/rdcu-ajouter-question-vf.png "RDCU Ajouter question VF")

![RDCU Ajouter question choix multiple ](../../docs/modeles/exports/rdcu-ajouter-question-choix-multiple.png "RDCU Ajouter question choix multiple")

![RDCU Ajouter question reponse courte ](../../docs/modeles/exports/rdcu-ajouter-question-reponse-courte.png "RDCU Ajouter question reponse courte")

![RDCU Ajouter question numerique ](../../docs/modeles/exports/rdcu-ajouter-question-numerique.png "RDCU Ajouter question numerique")

![RDCU Ajouter question essai ](../../docs/modeles/exports/rdcu-ajouter-question-essai.png "RDCU Ajouter question essai")

![RDCU Ajouter question correpondance ](../../docs/modeles/exports/rdcu-ajouter-question-mise-en-correspondance.png "RDCU ajouter question correspondance")

![RDCU confirmer suppression ](../../docs/modeles/exports-it-3/v2-rdcu-confirmer-suppression.png "RDCU confirmer suppression")





## Vérification finale

- [ ] Vous avez un seul MDD
  - [ ] Vous avez mis un verbe à chaque association
  - [ ] Chaque association a une multiplicité
- [ ] Vous avez un DSS par cas d'utilisation
  - [ ] Chaque DSS a un titre
  - [ ] Chaque opération synchrone a un retour d'opération
  - [ ] L'utilisation d'une boucle (LOOP) est justifiée par les exigences
- [ ] Vous avez autant de contrats que d'opérations système (pour les cas d'utilisation nécessitant des contrats)
  - [ ] Les postconditions des contrats sont écrites au passé
- [ ] Vous avez autant de RDCU que d'opérations système
  - [ ] Chaque décision de conception (affectation de responsabilité) est identifiée et surtout **justifiée** (par un GRASP ou autre heuristique)
  - [ ] Votre code source (implémentation) est cohérent avec la RDCU (ce n'est pas juste un diagramme)
- [ ] Vous avez un seul diagramme de classes
- [ ] Vous avez remis la version PDF de ce document dans votre répertoire
- [ ] [Vous avez regardé cette petite présentation pour l'architecture en couche et avez appliqué ces concepts](https://log210-cfuhrman.github.io/log210-valider-architecture-couches/#/) 
