declare module 'string-similarity' {
  /**
   * Returns a fraction between 0 and 1, which indicates the degree of similarity between the two strings.
   * 0 indicates completely different strings, 1 indicates identical strings.
   * The comparison is case-sensitive.
   * @param str1 First string to compare.
   * @param str2 Second string to compare.
   */
  export function compareTwoStrings(str1: string, str2: string): number;
  
  /**
   * Compares `mainString` against each string in `targetStrings`.
   * @param mainString The string to match each target string against.
   * @param targetStrings Each string in this array will be matched against the main string.
   * @returns An object with a `ratings` property, which gives a similarity rating for each target string,
   * and a `bestMatch` property, which specifies which target string was most similar to the main string.
   */
  export function findBestMatch(mainString: string, targetStrings: string[]): {
    ratings: Array<{
      target: string;
      rating: number;
    }>;
    bestMatch: {
      target: string;
      rating: number;
      index: number;
    };
    bestMatchIndex: number;
  };
}