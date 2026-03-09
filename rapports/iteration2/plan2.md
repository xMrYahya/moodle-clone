# Plan d'itération 2

## Étapes jalons

| Étape jalon          | Date       |
| :------------------- | :--------- |
| Début de l'itération 2 et remise du plan d'itération 2 | 2026/02/16 |
| Livraison interne du MDD | 2026/02/19 |
| Livraison interne des artéfacts pour le CU02b, c, d | 2026/02/23 |
| Revue par les pairs des artéfacts pour le CU05a, b, c, d | 2026/02/26 |
| Tests complet d'intégration du code système | 2026/03/02 |
| Vérification de la cohérence documentation/code | 2026/03/06 |
| Remise du rapport d'itération | 2026/03/08 |
| Démonstration technique du projet | 2026/03/09 |
| Fin de l'itération et remise du plan d'itération avec évaluations | 2026/03/09 |

## Objectifs clés

- Convertir le code pour utiliser la même langue partout 
- Réduire les décalages entre les diagrammes et le code final 
- Présenter une démonstration technique de CU02b, c et d avec leurs tests (3,75 points).
- Présenter une démonstration technique de CU05a, b, c et d avec leurs tests (4,5 points).


## Affectations d'éléments de travail

Les éléments de travail suivants seront abordés dans cette itération:

| Nom / Description                | Priorité | [Taille estimée (points)](#commentEstimer "Comment estimer?") | Assigné à (nom) | Documents de référence |
| -------------------------------- | -------: | --------------------------: | --------------- | ---------------------- |
| Ajout des DSS et contrats d'operation des nouveaux CU | 1 | 1 | Alexandre Gamache |Exigences pour le lab|
| Mise a jour du MDD | 1 | 1 | Alexandre Gamache |  |
| CU02b,c code, tests et RDCUs | 1 | 2 | Yahya Ardy, Alex Boulianne | Exigences pour le lab |
| CU05a,b,c,d code, tests et RDCUs| 1 | 2 | Kassem Kandil, raphael hoffmann| Exigences pour le lab |

## Problèmes

| Problème                                                                                             | Notes |
| ---------------------------------------------------------------------------------------------------- | ----- |
| Lucas nous a dit sur discord qu'il a fait une commotion cérébrale durant la semaine. Il est aller voir un médecin qui l'a mis en arrêt de travail pour une semaine. | Si il peut se remmettre assez vite pour réintégrer l'équipe, il en fera un peu plus pour les itérations 2 et 3. |
| Lorsque nous faisions les diagrammes pour l'itération 1, nous avions un peu de difficulté à bien comprendre le projet. C'est seulement lorsque nous sommes arrivés à faire le code que nous avons réussis à comprendre ce qui fonctionnait ou ne fonctionnait pas dans notre conception. |   |
| Lors de l'implémentation du CU01c, nous avons oublier d'ajouter le message de confirmation, qui permet de signaler l'utilisateur que le cours a bien été supprimer. | Kassem a dit qu'il ferait les corrections pour celui-ci |

## Critères d'évaluation

- Une majorité des membres de l'équipe a approuvé chaque diagramme.
- Un minimum de 90% des cas de test passent avec succès.
- Corriger les erreurs mentionnés lors de la correction de l'itération 2.



## Évaluation

| Résumé | |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Cible d'évaluation                    | Itération 3       |
| Date d'évaluation  |   2026/03/09 |
| Participants       | **Coéquipiers** : Alex Boulianne, Alexandre Gamache, Raphael Hoffmann, (Kassem Kandil et Yahya Ardy avaient des absences justifiées),<br> **Auxiliaire d'enseignement** : Thierry Fokou Toukam |
| État du projet     | 🟢  |


### Questions d'évaluation

1. Est-ce qu'il y a un décalage de représentation?
      Oui, il y a encore un décalage entre notre code et les diagrammes, mais nous essayons de le réduire le plus possible.

  - Est-ce que tous les noms de classe ont un rapport avec le domaine?
      Oui, les noms que nous avons choisi sont en lien avec la situation ou la fonctionnalité qu'elle essaye d'accomplir

2. Est-ce que l'architecture en couche est respectée?
      Nous essayons le mieux possible de suivre une architecture MVC.

   - Est-ce que les contrôleurs GRASP sont bien identifiés?
      Oui, nous avons identifié chaque controlleur GRASP dans nos RDCU.

   - Est-ce que les paramètres des opérations système sont tous de type primitif ou sont des objets de paramètres de type primitif?
      Toute les opérations système utilisent des types primitifs.

   - Est-ce que vous avez un fichier de route par contrôleur?
      Oui, nous avons un fichier de route par contrôleur

3. Évaluer votre conception par rapport aux GRASP "forte cohésion" et "faible couplage"

   - Avez-vous des classes qui sont couplées avec "beaucoup" d'autres classes?
      Nos classes qui sont contrôleur ont un couplage fort. Il serait possible de le réduire, mais avec beaucoup de difficulté.

   - Avez-vous des classes qui ont beaucoup de responsabilités (d'opérations)?
      Oui, les contrôleurs ont plusieurs sont en charge de plusieurs opérations.

   - Faite surtout attention aux responsabilités que vous avez données à vos contrôleurs.
      Nous essayons de minimiser le plus possible les opérations des contrôleur pour qu'ils aille seulement ce qu'ils ont besoin.

4. Y a-t-il des problèmes de [Code smell](https://refactoring.guru/fr/refactoring/smells) dans notre projet?
   1. Mysterious name relié au décalage des représentations ou pas
      1. Nous avons encore à nous assurer d'avoir tous changer les noms du MDD

   2. Large class (cohésion)
      1. Nous avons seulement les contrôleurs qui sont de grande taille, les autres classes sont assez petites.

   3. Trop de paramètres (4+)
      1. Nous ne pensons pas que nos fonctions utilisent trop de paramètres.
  
### Évaluation par rapport aux objectifs

- Convertir le code pour utiliser la même langue partout 
   - nous avons réussi a changer la langue de toutes les classes et les fonctions que nous avons créé
- Réduire les décalages entre les diagrammes et le code final 
   - Nous avons réussi a réduire le décalage entre les diagrammes et le code final mais il reste du décalage avec certains RDCUs et le MDD
- Présenter une démonstration technique de CU02b, c et d avec leurs tests (3,75 points).
   - La démonstration technique a fonctionné mais il faut ajouter un message de confirmation et réparer les cas de tests
- Présenter une démonstration technique de CU05a, b, c et d avec leurs tests (4,5 points).
   - La démonstration technique a fonctionné mais il faut réparer les cas de tests

### Éléments de travail: prévus vs réalisés

Tout les éléments de travail du plan on été réalisé sauf les tests

### Évaluation par rapport aux résultats selon les critères d'évaluation

Les démos pour touts les cas d'utilisation ont réussi mais il manque un message de confirmation lors de modification et suppression de question. Il faut aussi ajouter des cas de tests

## Autres préoccupations et écarts

Nous avons communiqué avec les chargé de lab afin de mieux comprendre comment représenter les controlleurs et les modèles dans les diagrammes

## Évaluation du travail d'équipe

- Alexandre a fait les DSS, les CO et a mis à jour le MDD
- Alex a fait les RDCUs pour le CU02b,c,d
- Raphael a fait les RDCUs pour le CU05  
- Le code pour le CU02b,c,d a été fait par Yahya.
- Le code pour le CU05 a été fait par Kassem
- Les Diagramme de l'itération précédente ont été réparé par Alexandre, Alex et Raphael
- Le rapport à été fait par Alexandre et Alex

Nous n'avons toujours pas voulu utiliser Github insights puisque la modifications des diagrammes et des pdf augmentent la quantité de lignes et commit et n'est pas représentatif

### Retrait d'un membre de l'équipe pour contribution non significative
 
   Lucas Montion s'est retiré de l'équipe (abandon de cours)
