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
| CU02b,c  | 1 | 2 | Yahya Ardy, Alex Boulianne | Exigences pour le lab |
| CU05a,b,c,d| 1 | 2 | Kassem Kandil, raphael hoffmann| Exigences pour le lab |

## Problèmes

| Problème                                                                                             | Notes |
| ---------------------------------------------------------------------------------------------------- | ----- |
| Lucas nous a dit sur discord qu'il a fait une commotion cérébrale durant la semaine. Il est aller voir un médecin qui l'a mis en arrêt de travail pour une semaine. | Si il peut se remmettre assez vite pour réintégrer l'équipe, il en fera un peu plus pour les itérations 2 et 3. |
| Lorsque nous faisions les diagrammes pour l'itération 1, nous avions un peu de difficulté à bien comprendre le projet. C'est seulement lorsque nous sommes arrivés à faire le code que nous avons réussis à comprendre ce qui fonctionnait ou ne fonctionnait pas dans notre conception. |   |
| Lors de l'implémentation du CU01c, nous avons oublier d'ajouter le message de confirmation, qui permet de signaler l'utilisateur que le cours a bien été supprimer. | Kassem a dit qu'il ferait les corrections pour celui-ci |

## Critères d'évaluation

> Une brève description de la façon d'évaluer si les objectifs (définis plus haut) de haut niveau ont été atteints.
> Vos critères d'évaluation doivent être objectifs (aucun membre de l'équipe ne peut avoir une opinion divergente) et quantifiables (sauf pour ceux évalués par l'auxiliaire d'enseignement). En voici des exemples:

- Une majorité des membres de l'équipe a approuvé chaque diagramme.
- Un minimum de 90% des cas de test passent avec succès.
- Corriger les erreurs mentionnés lors de la correction de l'itération 1.

## Évaluation

| Résumé | |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Cible d'évaluation                    | Itération 1       |
| Date d'évaluation  |   2026/02/09 |
| Participants       | **Coéquipiers** : Alex Boulianne, Alexandre Gamache, Kassem Kandil,Raphael Hoffmann (Lucas Montion et Yahya Ardy avaient des absences justifiées),<br> **Auxiliaire d'enseignement** : Thierry Fokou Toukam |
| État du projet     | 🟢  |

### Questions d'évaluation
1. Est-ce qu'il y a un décalage de représentation?
    - Les noms des classes ne correspondent pas exactement avec le mdd
    - Les noms des fonctions dans les RDCU ne correspondent pas exactement avec ceux du code
2. Est-ce que l'architecture en couche est respectée?
   - Chaque controlleur contiens controlleur dans son nom
   - Toute les operations systême utilisent des types primitifs
   - Nous avons un fichier de route par controlleur
3. Évaluer votre conception par rapport aux GRASP "forte cohésion" et "faible couplage"
   - Avez-vous des classes qui sont couplées avec "beaucoup" d'autres classes?
   - Certaines classes tels que coursControlleur doivent être grandement couplé. Réduire leurs coouplage serait possible mais complexe
   - Chaque controlleur accomplis seulement les tâches nécessaire
4. Y a-t-il des problèmes de [Code smell](https://refactoring.guru/fr/refactoring/smells) dans notre projet?
   1. Mysterious name relié au décalage des représentations ou pas
      - Les noms des classes devront être renomées pour être en francais
   2. Large class (cohésion)
      - Quelques classe sont plus grandes qu'elles devraient être telles que questionTypes pourraient être subdivisé en plusieurs classes
   3. Trop de paramètres (4+)
      - Aucune fonction utilise trop de paramêtres
   
### Évaluation par rapport aux objectifs
- Organiser l'espace de travail avec GitHub Project.
   - Nous avons organisé l'espace de travail, mais nous avons décidé de ne pas utiliser GitHub Project.
- Adapter le squelette du projet à nos exigences.
   - Nous avons effacé les classes inutiles du projet et nous avons covertis les classes nécessaires.
- Présenter une démonstration technique de CU01 avec tests (2,5 points).
   - Nous avons présenté les tests et le fonctionnement du CU01 durant la démo
- Présenter une démonstration technique de CU02a avec tests (5,75 points).
   - Nous avons présenté les tests et le fonctionnement du CU02a durant la démo

### Éléments de travail: prévus vs réalisés

- Tous les éléments ont été complétés, mais il faut réduire le décalage entre le code et les diagrammes
- Tout les tests ont passés 
- CU01ABC et CU02a sont complétés

### Évaluation par rapport aux résultats selon les critères d'évaluation

Les démos pour tout les cas d'utilisations ont réussi, mais il manque un message de confirmation à l'enseignant lorsqu'il efface un cours.

## Autres préoccupations et écarts

Nous avons vérifié le fonctionnement du language GIFT pour le CU02

## Évaluation du travail d'équipe


- Chaque membre de l'équipe a fait un ou deux RDCU .
- Alexandre et Raphael on fait le MDD.
- Alexandre a fait les DSS pour les CU.
- Le code pour le CU01 a été fait par Kassem.
- Le code pour le CU02a a été fait par Yahya
- Les test ont été créé par Kassem
- Le rapport a été fait par Alex et Alexandre
- Chaque membre de l'équipe a apporté des modifications aux RDCU au moment du rapport
- Raphael a ajouté le diagramme de classes

Lucas Montion souffre d'une commotion cérébrale et a été forcé de réduire la contribution effectué
Nous avons décidé de ne pas utiliser GitHub insigts puisque l'ajout du template du projet est compté et modifie les résultats

### Retrait d'un membre de l'équipe pour contribution non significative

N/A

---
