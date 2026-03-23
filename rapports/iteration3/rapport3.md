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
| CU08                            | (tous)              |
|   CU08 - conception             | Raphael + Alexandre |
|   CU08 - test et implémentation | Kassem + Yahya      |
|   CU08 - mise à jour des modèles| Alex                |


## Modèle du domaine (MDD)

> Le MDD est cumulatif : vous devez y ajouter des éléments à chaque itération (ou corriger les erreurs), selon la portée (et votre meilleure compréhension du problème) visée par votre solution. 
> Utilisez une légende dans le MDD pour indiquer la couleur de chaque itération afin de faire ressortir les changements (ce n'est pas toujours possible pour les associations et les attributs). Voir les stéréotypes personnalisés : <https://plantuml.com/fr/class-diagram> et [comment faire une légende avec couleurs en PlantUML](https://stackoverflow.com/questions/30999290/how-to-generate-a-legend-with-colors-in-plantuml).

## Diagramme de séquence système (DSS)

> Un DSS pour chaque cas d'utilisation. 
> Veuillez utiliser des noms d'opérations significatifs comme "ajouterCours" (pas "opération1" ou "gérerCours").
> Veuillez typer les paramètres sans utiliser de types complexes (ex: "List<Cours>" n'est pas un type simple).

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

> Chaque cas d'utilisation nécessite une RDCU.
> Vos RDCU doivent être des diagrammes de séquences d'opérations tel que vu dans le cours de LOG121.
> Vos diagrammes doivent inclurent: 
> - La création des instances nécessaires pour réaliser cette séquence
> - Toutes les objets et classes nécessaires pour réaliser cette séquences, incluant les structures de données comme des objets Map, List, Set, etc.
> - Les appels de méthodes avec leurs paramètres et les types (paramètres et méthodes)
> - Les valeurs de retour avec leur type
> - L'ordre chronologique précis des messages
> - Les barres d'activation des instances pour montrer quand chaque objet est actif

## Diagramme de classe logicielle (DCL)

> Facultatif, mais fortement suggéré
> Ce diagramme vous aidera à planifier l'ordre d'implémentation des classes.  Très utile lorsqu'on utilise TDD.

### Diagramme de classe TPLANT
- Générer un diagramme de classe avec l'outil TPLANT et commenter celui-ci par rapport à votre MDD.
- https://www.npmjs.com/package/tplant
  
## Retour sur la correction du rapport précédent
> Veuillez insérer ici les diagrammes à revalider de l'itération précédente avec les corrections apportées.
> Démontrer que vous avez réglé les problèmes identifiés dans le rapport de l'itération précédente.

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
