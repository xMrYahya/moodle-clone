### Contrat AC01 - Démarrer Ajout Cours
---
**Opération:** 
demarrerAjoutCours()

**Préconditions:**
L'Enseignant doit être authentifié.
Le service SGB est accessible.

**PostConditions:**
L'enseignant a récupéré depuis SGA la liste des groupes-cours.


### Contrat AC02 - Sélectionner Cours
---
**Opération:**  
sélectionnerGroupeCours(idGroupe : String)

**Références croisées:**
Contrat AC01 Démarrer Ajout Cours

**Préconditions:**
L'Enseignant est authentifié.
Un jeton d'authentification valide est présent dans la session.
La liste des groupes-cours assignés à l'enseignant a été récupérée préalablement via demarrerAjoutCours()


**PostConditions:**
Une instance c : Cours a été créée.
c est associée à l'Enseignant authentifié.
Les étudiants inscrit à ce groupe-cours sont associés a c. 
Les informations du groupe-cours(horaire, local, etc.) sont enregistrées dans c.