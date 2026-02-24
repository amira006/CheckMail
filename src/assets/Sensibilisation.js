import React from "react";
import "./Sensibilisation.css";

function Sensibilisation() {
  return (
    <div className="Sensibilisation-container">
      <h1>CheckMail - Sensibilisation</h1>

      <section>
        <h2>Présentation du Projet</h2>
        <p>
          CheckMail est une application web intelligente capable de détecter
          automatiquement les emails Spam et Phishing grâce au Machine Learning.
          Notre objectif est de protéger les utilisateurs contre les fraudes numériques
          et d'améliorer la sécurité numérique.
        </p>
      </section>

      <section>
        <h2>Comment fonctionne la détection ?</h2>
        <p>
          Le système analyse le contenu du message, nettoie le texte,
          le transforme en données numériques, puis l’évalue grâce
          à un modèle de Machine Learning entraîné sur un grand nombre d’emails.
        </p>
      </section>

      <section>
        <h2>Types d'attaques de Phishing</h2>
        <ul>
          <li>Email Phishing</li>
          <li>Spear Phishing</li>
          <li>Vishing (appel téléphonique frauduleux)</li>
          <li>Smishing (SMS frauduleux)</li>
        </ul>
      </section>

      <section>
        <h2>Comment reconnaître un email suspect ?</h2>
        <ul>
          <li>Adresse email inhabituelle ou mal orthographiée</li>
          <li>Message urgent ou menaçant</li>
          <li>Fautes d’orthographe</li>
          <li>Demande d’informations personnelles ou bancaires</li>
          <li>Liens suspects</li>
        </ul>
      </section>

      <section>
        <h2>Conseils pour éviter le Phishing</h2>
        <ul>
          <li>Ne cliquez jamais sur des liens inconnus</li>
          <li>Vérifiez toujours l’expéditeur</li>
          <li>Ne partagez jamais vos mots de passe</li>
          <li>Activez l’authentification à deux facteurs</li>
          <li>Mettez à jour régulièrement vos logiciels</li>
        </ul>
      </section>
    </div>
  );
}

export default Sensibilsation;