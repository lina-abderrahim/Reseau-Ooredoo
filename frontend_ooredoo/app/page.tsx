import { redirect } from "next/navigation";

/**
 * Page d'entrée sécurisée.
 * Redirige immédiatement vers l'authentification.
 */
export default function HomePage() {
  redirect("/login");
  
  // Retourne null car la redirection est prioritaire côté serveur
  return null;
}


