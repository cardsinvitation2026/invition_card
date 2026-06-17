export interface SignedVideoUrlResult {
  url: string;
  expiresAt: string;
}

export interface GenerateSignedVideoUrlInput {
  sourceUrl: string;
}
