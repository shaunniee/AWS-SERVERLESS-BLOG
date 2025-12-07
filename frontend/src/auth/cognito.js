// src/auth/cognito.js
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

const region = import.meta.env.VITE_COGNITO_REGION;
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

if (!region || !userPoolId || !clientId) {
  console.warn("Cognito env vars missing – admin auth will not work");
}

const pool = new CognitoUserPool({
  UserPoolId: userPoolId,
  ClientId: clientId,
});

// ---------- small helpers to read stored tokens ----------

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  // Use ID token for API Gateway JWT authorizer
  return localStorage.getItem("blogAuthIdToken") || null;
}

export function getStoredUsername() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("blogAuthUsername") || null;
}
export function clearStoredSession() {
  try {
    localStorage.removeItem("blogAuthAccessToken");
    localStorage.removeItem("blogAuthIdToken");
    localStorage.removeItem("blogAuthUsername");
  } catch {
    // ignore
  }
}

// ---------- sign in (handles FORCE_CHANGE_PASSWORD) ----------

export function signIn(username, password) {
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const user = new CognitoUser({
      Username: username,
      Pool: pool,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const accessToken = session.getAccessToken().getJwtToken();
        const idToken = session.getIdToken().getJwtToken();

        if (typeof window !== "undefined") {
          localStorage.setItem("blogAuthAccessToken", accessToken);
          localStorage.setItem("blogAuthIdToken", idToken);
          localStorage.setItem("blogAuthUsername", username);
        }

        resolve({ session, accessToken, idToken });
      },

      onFailure: (err) => {
        reject(err);
      },

      // This is called when user is in FORCE_CHANGE_PASSWORD state
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // Remove attributes Cognito doesn't want you to send back
        delete userAttributes.email_verified;
        delete userAttributes.phone_number_verified;
        delete userAttributes.email;          // 👈 THIS is the one causing your error
        delete userAttributes.phone_number;   // safe to drop too

        // For this admin-only app, just use the same password as the new one
        user.completeNewPasswordChallenge(
          password,
          userAttributes,
          {
            onSuccess: (session) => {
              const accessToken = session.getAccessToken().getJwtToken();
              const idToken = session.getIdToken().getJwtToken();

              if (typeof window !== "undefined") {
                localStorage.setItem("blogAuthAccessToken", accessToken);
                localStorage.setItem("blogAuthIdToken", idToken);
                localStorage.setItem("blogAuthUsername", username);
              }

              resolve({ session, accessToken, idToken });
            },
            onFailure: (err) => {
              reject(err);
            },
          }
        );
      },


    });
  });
}

// ---------- sign out ----------

export function signOut() {
  const currentUser = pool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("blogAuthAccessToken");
    localStorage.removeItem("blogAuthIdToken");
    localStorage.removeItem("blogAuthUsername");
  }
}
