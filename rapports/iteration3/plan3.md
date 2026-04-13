# Plan d'itération 3


## Étapes jalons


| Étape jalon          | Date       |
| :------------------- | :--------- |
| Début de l'itération | 2026/03/16 |
| Démo (séance 5)      | 2026/04/13 |
| Fin de l'itération   | 2019/04/13 |

## Objectifs clés

- Présenter une démonstration technique de CU08 avec tests.
- Mettre à jour la documentation
- Régler le décalage entre le code et les modèles

## Affectations d'éléments de travail

Les éléments de travail suivants seront abordés dans cette itération:

| Nom / Description                | Priorité | [Taille estimée (points)](#commentEstimer "Comment estimer?") | Assigné à (nom) | Documents de référence |
| -------------------------------- | -------: | --------------------------: | ------------------- | ---------------------- |
| CU08                             | 1        | 1                           | (tous)              | Exigences pour le lab  |
|   CU08 - conception              |          |                             | Raphael + Alexandre |                        |
|   CU08 - test et implémentation  |          |                             | Kassem + Yahya      |                        |
|   CU08 - mise à jour des modèles |          |                             | Alex                |                        |

## Problèmes

| Problème                                                                                                    | Notes |
| ----------------------------------------------------------------------------------------------------------- | ----- |
| L'équipe avait planifié ses implémentations pour une équipe de 6, mais nous sommes devenus une équipe de 5  |       |
| Certains tests échouent encore ou doivent être corrigés                                                     |       |

## Critères d'évaluation

- Une majorité des membres de l'équipe a approuvé chaques diagrammes.
- Un minimum de 90% des cas de test passent avec succès.
- Corriger les erreurs mentionnées lors de la correction des itérations 1 et 2.

## Évaluation
| Résumé | |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Cible d'évaluation                    | Itération 3
| Date d'évaluation  |   2026/03/30 |
| Participants       | **Coéquipiers** : Alex Boulianne, Alexandre Gamache, Raphael Hoffmann, Kassem Kandil et Yahya Ardy<br> **Auxiliaire d'enseignement** : Thierry Fokou Toukam |
| État du projet     | 🟢 

### Questions d'évaluation
Regardez votre diagramme TPLANT et répondez aux questions suivantes?
1. Est-ce qu'il y a un décalage de représentation?
  - Est-ce que tous les noms de classe ont un rapport avec le domaine?
      
     **Les noms de chaque classes ont un rapport avec le domaine incluant les modeles et les contrôleurs** 

2. Est-ce que l'architecture en couche est respectée?
   - Est-ce que les contrôleurs GRASP sont bien identifiés?
      
      **Nous avons biens indiqué les contrôleurs et les modeles dans les noms des classes et les rdcus**

   - Est-ce que les paramètres des opérations système sont tous de type primitif ou sont des objets de paramètres de type primitif?
      
      **Chaque Parametre d'opération système traite uniquement des types primitifs**
   
   - Est-ce que vous avez un fichier de route par contrôleur?
      
      **Chaque contrôleur a un fichier de route qui avec un nom correspondant**

3. Évaluer votre conception par rapport aux GRASP "forte cohésion" et "faible couplage"
   - Avez-vous des classes qui sont couplées avec "beaucoup" d'autres classes?

      **Nos controlleurs, surtout le QuestionController,  on beaucoup de couplage avec des classes qu'il ne devraient possiblement pas directement gérer. Il faudrait plutôt faire appel au autres contrôleurs**

   - Avez-vous des classes qui ont beaucoup de responsabilités (d'opérations)?

      **Les modêles ont beaucoup de responsabilités qui ne sont pas totalement approprié, comme mentionné avant, le QuestionController a plus de responsabilités qu'il devrait avoir**

4. Y a-t-il des problèmes de Code smell à identifier avec l'aide de TPLANT
   1. Mysterious name relié au décalage des représentations ou pas
      1. Identifier le renommage (réusinage) éventuel de classe et/ou méthodes

      **Les méthodes de nos classes suivent correctement les noms des CO, il n'y aurait donc pas de réusinage a faire de ce type**

   2. Large class (cohésion)
      1. Proposer d'appliquer le réusinage Extract class / GRAPS fabrication pure 

      **Les modèles sont très grands et devraient séparer leurs responsabilités en plusieures classes**

   3. Trop de paramètres (4+)
      1. Proposer d'appliquer le réusinage Objet de paramètre

      **Aucune nouvelle fonction n'a trop de paramêtres. Les autres on déja été adressé dans le rapport précédent**

### Évaluation par rapport aux objectifs

- Présenter une démonstration technique de CU08 avec tests.
   - Nous avons correctement présenté une démo satisfaisant tout les critères du CU08 et nous avons ajouté les tets manquant
- Mettre à jour la documentation
   - Nous avons mis a jour les RDCU, DSS et CO qui contenaient des erreurs.
- Régler le décalage entre le code et les modèles
   - L'écart entre notre code et la documentation a été réduit le plus possible gâce a la mise a jour de la documentation

### Éléments de travail: prévus vs réalisés

Tous les éléments ont été complétés, mais certains des RDCUs pourraient être amélioré.

### Évaluation par rapport aux résultats selon les critères d'évaluation

Notre code et nos tests suivent correctement les critères d'évaluations. 

## Autres préoccupations et écarts

Nous avons vérifier avec les chargé de lab pour des meilleurs facon de gérer la modification de question

## Évaluation du travail d'équipe

> Évaluez la contribution de chaque membre de l'équipe au projet durant l'itération. Pour vous aider, utilisez `gitinspector` (voir les notes du cours). Toutefois, tenez aussi compte des éléments qui ne peuvent être évalués par l'outil (apprentissage, connaissances préalables, etc.)

Selon les statistiques générées par `gitinspector` Pierre et Jérémie font 90 % de la programmation et les deux autres membres doivent contribuer plus. Voir le script contribution.sh dans le répertoire scripts du projet.

Nous devons trouver un autre moyen de faire les commits (peut-être avec des branches et PR), car il y avait trop de merges difficiles de la documentation.

### Retrait d'un membre de l'équipe pour contribution non significative

Aucun membre de l'équipe n'a été retiré