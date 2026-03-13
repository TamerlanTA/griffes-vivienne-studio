# Project TODO - La Méthode Griffes Vivienne

## Design System & Base
- [x] Configurer la typographie élégante (Google Fonts - serif pour les titres)
- [x] Définir la palette de couleurs haut de gamme (or, beige, noir)
- [x] Créer le thème global dans index.css
- [x] Configurer les animations et transitions fluides

## Base de Données
- [x] Créer la table `credits` pour gérer les crédits utilisateurs
- [x] Créer la table `generations` pour historique des étiquettes générées
- [x] Créer la table `credit_transactions` pour l'historique des achats
- [x] Ajouter le champ `hasUsedFreeTrial` dans la table users

## Interface d'Accueil
- [x] Créer la page d'accueil avec hero section élégante
- [x] Implémenter le composant d'upload de logo avec drag & drop
- [x] Ajouter la prévisualisation du logo uploadé
- [x] Créer l'animation de transition vers l'écran de préparation

## Écran de Préparation
- [x] Créer l'interface de sélection des options de base (Classic, Fancy, BIO, Vintage)
- [x] Implémenter le menu "+ Options" avec options avancées
- [x] Ajouter la prévisualisation en temps réel de l'étiquette
- [x] Créer le bouton "Générer mon étiquette" avec état de chargement

## Génération d'Étiquettes
- [x] Intégrer l'API de génération d'images IA
- [x] Créer les prompts pour chaque type de texture (Satin, Coton, etc.)
- [x] Implémenter l'animation de chargement élégante pendant la génération
- [x] Créer l'écran de résultat avec l'étiquette générée
- [x] Ajouter les options de téléchargement (PNG, JPG, SVG)

## Système de Crédits
- [x] Créer la logique backend pour gérer les crédits
- [x] Implémenter l'affichage discret du solde de crédits
- [x] Créer l'interface d'achat de crédits avec packs prédéfinis
- [ ] Intégrer le système de paiement (Stripe)
- [x] Créer l'écran "essai gratuit utilisé" avec CTA d'achat

## Authentification
- [x] Implémenter la logique du premier essai gratuit sans inscription
- [x] Créer le flow d'authentification légère après la première génération
- [x] Gérer la persistance de session
- [x] Créer l'interface "Mon compte" avec historique des générations

## Polish & Animations
- [x] Ajouter les micro-interactions sur tous les boutons
- [x] Implémenter les transitions de page fluides
- [x] Créer les animations de chargement personnalisées
- [x] Optimiser les performances et temps de chargement
- [x] Tester sur différents appareils et navigateurs

## Tests & Déploiement
- [ ] Écrire les tests unitaires pour les fonctionnalités critiques
- [x] Tester le parcours utilisateur complet
- [x] Vérifier la responsivité mobile
- [x] Créer le checkpoint final

## Internationalisation (FR/EN)
- [x] Créer le système de gestion de langue (Context + Hook)
- [x] Créer les fichiers de traduction (fr.ts, en.ts)
- [x] Traduire la page Home en anglais
- [x] Traduire la page Prepare en anglais
- [x] Traduire la page Result en anglais
- [x] Traduire la page Credits en anglais
- [x] Traduire la page Account en anglais
- [x] Implémenter le sélecteur de langue dans le header
- [x] Persister la langue sélectionnée dans localStorage
- [x] Tester le changement de langue sur toutes les pages

## Suppression du fond blanc du logo
- [x] Ajouter mix-blend-mode: multiply sur la prévisualisation du logo
- [x] Tester avec différents logos (fond blanc, transparent, coloré)
- [x] Créer le checkpoint

## Simplification des textures (3 options)
- [x] Supprimer l'option "Fancy (Satin)" et "BIO (HD Coton)" pour ne garder que 3 textures
- [x] Renommer "Classic (HD)" en "HD Coton"
- [x] Garder "Taffetas" et "Satin"
- [x] Créer les 3 patterns CSS distincts (HD serré, Taffetas standard, Satin orienté brillant)
- [x] Implémenter le changement dynamique de texture dans la prévisualisation
- [x] Mettre à jour les traductions FR/EN
- [x] Créer le checkpoint

## Retour à 4 options avec effet de drapé Satin (V1.2)
- [x] Revenir à 4 options distinctes : HD, HD Coton, Satin, Taffetas
- [x] HD et HD Coton partagent le même pattern CSS (quadrillage serré)
- [x] Créer l'effet de drapé ondulé pour le Satin (vagues subtiles + brillance)
- [x] Rendre le Satin plus brillant avec gradient et ombres
- [x] Mettre à jour les 4 prompts IA distincts pour chaque rendu
- [x] Mettre à jour les traductions FR/EN
- [x] Créer le checkpoint V1.2

## Différenciation visuelle HD Coton (V1.2.1)
- [x] Modifier le pattern CSS du HD Coton pour qu'il soit distinct du HD
- [x] HD Coton : 1.5× plus fin que taffetas (au lieu d'identique au HD)
- [x] HD reste à 2× plus fin que taffetas
- [x] Tester visuellement les 4 patterns distincts
- [x] Créer le checkpoint V1.2.1

## Intégration des Moodboards (Images de Référence)
- [ ] Convertir les 8 images en base64 (HD1, HD2, Coton1, Coton2, SATIN2, SATIN3, Taffetas1, Taffetas2)
- [ ] Créer le fichier moodboards.ts avec les images en base64
- [ ] Intégrer les moodboards dans nanoBananaService.ts
- [ ] Tester la génération avec moodboards
- [ ] Valider que l'IA utilise bien les références visuelles

## Tests de Génération Nano Banana Pro
- [x] Tester la génération HD avec moodboards
- [ ] Tester la génération HD Coton avec moodboards
- [ ] Tester la génération Satin avec moodboards
- [ ] Tester la génération Taffetas avec moodboards

## Corrections Bug SVG
- [x] Convertir les logos SVG en PNG côté frontend avant envoi à l'API Gemini
- [x] Corriger le regex d'extraction base64 dans routers.ts pour les MIME types complexes

## Correction Couleur Satin
- [ ] Corriger le problème de fond noir au lieu de beige pour les étiquettes Satin
