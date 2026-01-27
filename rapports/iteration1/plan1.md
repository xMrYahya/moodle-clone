# Plan d'itération 1 (exemple)

## Étapes jalons

| Étape jalon          | Date       |
| :------------------- | :--------- |
| Début de l'itération et remise du plan d'itération | 2026/01/26 |
| Création du projet sur GitHub Project et configuration de l'environnement de développement | 2026/01/26 |
| Livraison interne du MDD | 2026/02/30 |
| Livraison interne des artéfacts pour le CU01, CU02a,b et d | 2026/02/02 |
| Revue par les pairs des artéfacts pour le CU01, CU02a  | 2026/02/02 |
| Tests complet d'intégration du code système | 2026/02/13 |
| Vérification de la cohérence documentation/code | 2026/02/13 |
| Remise du rapport d'itération | 2026/02/15 |
| Démonstration technique du projet | 2026/02/16 |
| Fin de l'itération et remise du plan d'itération avec évaluations | 2026/02/16 |

## Objectifs clés

- Organiser l'espace de travail avec GitHub Project.
- Adapter le squelette du projet à nos exigences.
- Présenter une démonstration technique de CU01 avec tests (2,5 points).
- Présenter une démonstration technique de CU02a avec tests (5,75 y points).


## Affectations d'éléments de travail

Les éléments de travail suivants seront abordés dans cette itération:

| Nom / Description                | Priorité | [Taille estimée (points)](#commentEstimer "Comment estimer?") | Assigné à (nom) | Documents de référence |
| -------------------------------- | -------: | --------------------------: | --------------- | ---------------------- |
| CU01                             | 1        | 1                           | (tous)          | Exigences pour le lab  |
|   CU01 - conception                |          |                             | Kassem Kandil,Raphael    |                        |
|   CU01 - test et implémentation     |          |                             | Kassem Kandil          |                        |
|   CU01 - mise à jour des modèles |          |                             | Alex          |                        |
| CU02a                             | 2        | 2                           | (tous)          | Exigences pour le lab  |
| CU02a - conception                |          |                             | Alexandre, Yahya,Raphael        |                        |
| CU02a - test et implémentation     |          |                             | Alexandre, Yahya          |                        |
| CU02a - mise à jour des modèles |          |                             | Alexandre,           |                        |

## Problèmes

| Problème                                                                                             | Notes |
| ---------------------------------------------------------------------------------------------------- | ----- |
| Manque un membre au premier laboratoire.                       |       |


## Critères d'évaluation

- Une majorité des membres de l'équipe a approuvé chaque diagramme.
- Un minimum de 90% des cas de test passent avec succès.
- Démonstration avec succès des fonctionnalités CU06 et CU07 pas à pas avec l'auxiliaire d'enseignement.

## Évaluation

<!-- GitHub ne supporte pas les tables sans en-tête: https://stackoverflow.com/a/17543474/1168342 -->
| Résumé | |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Cible d'évaluation                    | Itération <!-- *Cela pourrait être toute l'itération ou simplement un composant spécifique* -->                            |
| Date d'évaluation  |   2026/02/13 |
| Participants       | **Coéquipiers** : Jérémie, Jacques-Éric, Pierre (Hélène avait une absence justifiée),<br> **Auxiliaire d'enseignement** : Jonathan Mayhem |
| État du projet     | 🟢 <!-- 🔴🟠🟢 *Rouge, Orange, ou Vert.* --> |

### Questions d'évaluation

1. Est-ce qu'il y a un décalage de représentation?
  - Est-ce que tous les noms de classe ont un rapport avec le domaine?
2. Est-ce que l'architecture en couche est respectée?
   - Est-ce que les contrôleurs GRASP sont bien identifiés?
   - Est-ce que les paramètres des opérations système sont tous de type primitif ou sont des objets de paramètres de type primitif?
   - Est-ce que vous avez un fichier de route par contrôleur?
3. Évaluer votre conception par rapport aux GRASP "forte cohésion" et "faible couplage"
   - Avez-vous des classes qui sont couplées avec "beaucoup" d'autres classes?
   - Avez-vous des classes qui ont beaucoup de responsabilités (d'opérations)?
     - Faite surtout attention aux responsabilités que vous avez données à vos contrôleurs.
4. Y a-t-il des problèmes de [Code smell](https://refactoring.guru/fr/refactoring/smells) dans notre projet?
   1. Mysterious name relié au décalage des représentations ou pas
      1. Identifier le renommage (réusinage) éventuel de classe et/ou méthodes
   2. Large class (cohésion)
      1. Proposer d'appliquer le réusinage Extract class / GRAPS fabrication pure 
   3. Trop de paramètres (4+)
      1. Proposer d'appliquer le réusinage Objet de paramètre
   > Ajouter d'autres questions si nécessaire
   
### Évaluation par rapport aux objectifs

- Résoudre les problèmes de la dernière itération soulevés par l'auxiliaire d'enseignement.
  - La rétroaction de l'auxiliaire d'enseignement a été positive. Bon travail l'équipe!
- Présenter une démonstration technique.
  - Le CU06 a été convaincant pour l'auxiliaire d'enseignement, mais il a trouvé que les tests pour le CU07 n'étaient pas assez étoffés. On doit corriger ça à la prochaine itération si on veut que le CU07 compte pour l'implémentation finale.

### Éléments de travail: prévus vs réalisés

Tous les éléments ont été complétés, mais il faut étoffer les tests du CU07:

- CU07 - test et implémentation assignés à Hélène

### Évaluation par rapport aux résultats selon les critères d'évaluation

La solution a répondu à tous les critères, mais attention: il faut rajouter des cas de tests.

## Autres préoccupations et écarts

Nous avons discuté avec plusieurs professeurs pour comprendre le flux de travail de construction des devoirs à faire en ligne (CU06).

## Évaluation du travail d'équipe

> Évaluez la contribution de chaque membre de l'équipe au projet durant l'itération. Pour vous aider, utilisez `GitHub Insights`. Toutefois, tenez aussi compte des éléments qui ne peuvent être évalués par l'outil (apprentissage, connaissances préalables, participation, communication, etc.)

Selon les statistiques générées par `GitHub Insights` Pierre et Jérémie font 90 % de la programmation et les deux autres membres doivent contribuer plus. 

Nous devons trouver un autre moyen de faire les commits (peut-être avec des branches et PR), car il y avait trop de merges difficiles de la documentation.

### Retrait d'un membre de l'équipe pour contribution non significative

- C'est ici que vous mettez le nom de la personne ainsi que les raisons du retrait. Cette section doit nécessairement inclure une liste d'objectifs que cette personne doit respecter pour pouvoir s'assurer de faire partie de l'itération suivante. 


---

<a name="commentPlanifier">Comment planifier une itération selon le
    processus unifié :</a>
    <https://etsmtl365-my.sharepoint.com/:w:/g/personal/christopher_fuhrman_etsmtl_ca/EWVA3MlzFHdElIMlduUvg6oBSAlrgHO7hjM2J93D1LGPSg?e=kCbXch>

<a name="commentEstimer">Comment estimer la taille :</a>
    <https://etsmtl365-my.sharepoint.com/:w:/g/personal/christopher_fuhrman_etsmtl_ca/EaEe2fDK94RAkfWthKX1pr4B7KBgbD9BW4UMrzwtQzOrkg?e=XMf4IK>
