# Plan d'itération 2

## Étapes jalons

| Étape jalon          | Date       |
| :------------------- | :--------- |
| Début de l'itération 2 et remise du plan d'itération 2 | 2026/02/09 |
| Livraison interne du MDD | 2026/02/12 |
| Livraison interne des artéfacts pour le CU02b, c, d | 2026/02/16 |
| Revue par les pairs des artéfacts pour le CU05a, b, c, d | 2026/02/19 |
| Tests complet d'intégration du code système | 2026/02/23 |
| Vérification de la cohérence documentation/code | 2026/02/26 |
| Remise du rapport d'itération | 2026/03/05 |
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
| Ajout des DSS des nouveaux CU | 1 | 1 |
| Mise a jour du MDD | 1 | 1 | QUI |
| CU02b,c  | 1 | 2 | QUI |  |
| CU05a,b,c,d| 1 | 2 | QuI | |

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

> Utiliser cette section pour la saisie et la communication des résultats et les actions des évaluations, qui sont généralement faites à la fin de chaque itération. Si vous ne le faites pas, l'équipe ne peut pas être en mesure d'améliorer la façon dont elle développe des logiciels.
> **Note:** cette section est complétée seulement après l'évaluation faite par l'auxiliaire d'enseignement, lors de la démo en lab.

<!-- GitHub ne supporte pas les tables sans en-tête: https://stackoverflow.com/a/17543474/1168342 -->
| Résumé | |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Cible d'évaluation                    | Itération <!-- *Cela pourrait être toute l'itération ou simplement un composant spécifique* -->                            |
| Date d'évaluation  |   2026/02/13 |
| Participants       | **Coéquipiers** : Jérémie, Jacques-Éric, Pierre (Hélène avait une absence justifiée),<br> **Auxiliaire d'enseignement** : Jonathan Mayhem |
| État du projet     | 🟢 <!-- 🔴🟠🟢 *Rouge, Orange, ou Vert.* --> |

### Questions d'évaluation

> Veuillez répondre aux questions suivantes:

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

> Documentez si vous avez abordé les objectifs précisés dans le plan d'itération. *(on reprend les objectifs)*

- Résoudre les problèmes de la dernière itération soulevés par l'auxiliaire d'enseignement.
  - La rétroaction de l'auxiliaire d'enseignement a été positive. Bon travail l'équipe!
- Présenter une démonstration technique.
  - Le CU06 a été convaincant pour l'auxiliaire d'enseignement, mais il a trouvé que les tests pour le CU07 n'étaient pas assez étoffés. On doit corriger ça à la prochaine itération si on veut que le CU07 compte pour l'implémentation finale.

### Éléments de travail: prévus vs réalisés

> Résumez si tous les éléments de travail prévus dans l'itération ont été abordés, et des éléments de travail qui ont été reportés ou ajoutés.

Tous les éléments ont été complétés, mais il faut étoffer les tests du CU07:

- CU07 - test et implémentation assignés à Hélène

### Évaluation par rapport aux résultats selon les critères d'évaluation

> Documentez si vous avez satisfait les critères d'évaluation précisés dans le plan d'itération. Cela pourrait inclure des informations telles que «&nbsp;Démo pour le département X a été bien accueilli, avec quelques préoccupations soulevées autour de la convivialité&nbsp;», ou, «&nbsp;495 cas de tests ont été automatisés avec un taux de réussite de 98&nbsp;%. 9 cas de test ont été reportés parce que les éléments de travail correspondants ont été reportés.&nbsp;»

La solution a répondu à tous les critères, mais attention: il faut rajouter des cas de tests.

## Autres préoccupations et écarts

> Documentez d'autres domaines qui ont été évalués, tels que la finance ou un type de programme, ainsi que la rétroaction des intervenants qui n'a pas été saisie ailleurs

Nous avons discuté avec plusieurs professeurs pour comprendre le flux de travail de construction des devoirs à faire en ligne (CU06).

## Évaluation du travail d'équipe

> Évaluez la contribution de chaque membre de l'équipe au projet durant l'itération. Pour vous aider, utilisez `GitHub Insights`. Toutefois, tenez aussi compte des éléments qui ne peuvent être évalués par l'outil (apprentissage, connaissances préalables, participation, communication, etc.)

Selon les statistiques générées par `GitHub Insights` Pierre et Jérémie font 90 % de la programmation et les deux autres membres doivent contribuer plus. 

Nous devons trouver un autre moyen de faire les commits (peut-être avec des branches et PR), car il y avait trop de merges difficiles de la documentation.

### Retrait d'un membre de l'équipe pour contribution non significative

- C'est ici que vous mettez le nom de la personne ainsi que les raisons du retrait. Cette section doit nécessairement inclure une liste d'objectifs que cette personne doit respecter pour pouvoir s'assurer de faire partie de l'itération suivante. 


---

<a name="commentPlanifier">Comment planifier une itération selon le
    processus unifié :</a>
    <https://etsmtl365-my.sharepoint.com/:w:/g/personal/christopher_fuhrman_etsmtl_ca/EWVA3MlzFHdElIMlduUvg6oBSAlrgHO7hjM2J93D1LGPSg?e=kCbXch>

<a name="commentEstimer">Comment estimer la taille :</a>
    <https://etsmtl365-my.sharepoint.com/:w:/g/personal/christopher_fuhrman_etsmtl_ca/EaEe2fDK94RAkfWthKX1pr4B7KBgbD9BW4UMrzwtQzOrkg?e=XMf4IK>
