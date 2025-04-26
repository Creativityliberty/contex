import fetch from 'node-fetch';

const CONTEXT7_API_BASE_URL = "https://context7.com/api";
const DEFAULT_TYPE = "txt";

/**
 * Recherche des librairies via l'API Context7
 * @param {string} query - Terme de recherche (ex: "react", "next")
 * @returns {Promise<Object|null>} - Résultats de recherche ou null en cas d'erreur
 */
export async function searchLibraries(query) {
  try {
    const url = new URL(`${CONTEXT7_API_BASE_URL}/v1/search`);
    url.searchParams.set("query", query);
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la recherche de librairies:", error);
    return null;
  }
}

/**
 * Récupère la documentation d'une librairie
 * @param {string} libraryId - ID de la librairie Context7
 * @param {Object} options - Options de recherche
 * @param {number} [options.tokens] - Nombre maximum de tokens
 * @param {string} [options.topic] - Sujet spécifique (ex: "routing")
 * @param {string} [options.folders] - Dossiers spécifiques
 * @returns {Promise<string|null>} - Documentation ou null en cas d'erreur
 */
export async function fetchLibraryDocumentation(
  libraryId,
  options = {}
) {
  try {
    const url = new URL(`${CONTEXT7_API_BASE_URL}/v1/${libraryId}`);
    if (options.tokens) url.searchParams.set("tokens", options.tokens.toString());
    if (options.topic) url.searchParams.set("topic", options.topic);
    if (options.folders) url.searchParams.set("folders", options.folders);
    url.searchParams.set("type", DEFAULT_TYPE);
    
    const response = await fetch(url, {
      headers: {
        "X-Context7-Source": "context7-api-server"
      }
    });
    
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    console.error("Erreur lors de la récupération de documentation:", error);
    return null;
  }
}

/**
 * Formate un résultat de recherche en texte lisible
 * @param {Object} result - Résultat de recherche
 * @returns {string} - Texte formaté
 */
export function formatSearchResult(result) {
  return `Title: ${result.title}\nID: ${result.id}\nDescription: ${result.description || "No description"}`;
}

/**
 * Formate les résultats de recherche en texte lisible
 * @param {Object} searchResponse - Réponse de recherche
 * @returns {string} - Texte formaté
 */
export function formatSearchResults(searchResponse) {
  return searchResponse.results.map(formatSearchResult).join("\n\n---\n\n");
}
