// src/services/AuthContext.js
// Extracted auth context to prevent circular dependency issues
// Screens can import useAuth without importing AppNavigator

import React, { createContext, useContext } from 'react';

export const AuthContext = createContext({ signIn: () => {}, signOut: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}
