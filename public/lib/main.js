// Si vous modifiez ce fichier, exécutez "npm run build" pour que votre server utilise la nouvelle version. Sinon le navigateur conserve l'ancienne version en cache.
window.addEventListener("load", function()
{
    document.querySelectorAll("button.lancer").forEach(function(element)
    {
        element.addEventListener("click", function()
        {
            fetch("/api/v1/jeu/jouer/" + this.id)
            .then(function()
            {
                location.reload();
            });
        });
    });

    document.querySelectorAll("button.terminer").forEach(function(element)
    {
        element.addEventListener("click", function()
        {
            fetch("/api/v1/jeu/terminerJeu/" + this.id)
            .then(function()
            {
                location.reload();
            });
        });
    });
});
