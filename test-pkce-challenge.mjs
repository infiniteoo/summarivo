// test-pkce-challenge.js
import pkceChallenge from "pkce-challenge";

const { verifier, challenge } = pkceChallenge();
console.log("Verifier:", verifier);
console.log("Challenge:", challenge);
