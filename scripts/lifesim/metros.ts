/** The six game metros (Census CBSA codes, 2023 delineation) and their anchor places. */
export const METROS = [
  { slug: "jacksonville", name: "Jacksonville", cbsa: "27260", anchorPlace: "jacksonville-fl", counties: ["duval-county-fl", "clay-county-fl", "st-johns-county-fl", "nassau-county-fl", "baker-county-fl"] },
  { slug: "orlando", name: "Orlando", cbsa: "36740", anchorPlace: "orlando-fl", counties: ["orange-county-fl", "osceola-county-fl", "seminole-county-fl", "lake-county-fl"] },
  { slug: "miami", name: "Miami", cbsa: "33100", anchorPlace: "miami-fl", counties: ["miami-dade-county-fl", "broward-county-fl", "palm-beach-county-fl"] },
  { slug: "tampa", name: "Tampa", cbsa: "45300", anchorPlace: "tampa-fl", counties: ["hillsborough-county-fl", "pinellas-county-fl", "pasco-county-fl", "hernando-county-fl"] },
  { slug: "destin", name: "Destin", cbsa: "18880", anchorPlace: "destin-fl", counties: ["okaloosa-county-fl", "walton-county-fl"] },
  { slug: "tallahassee", name: "Tallahassee", cbsa: "45220", anchorPlace: "tallahassee-fl", counties: ["leon-county-fl", "gadsden-county-fl", "jefferson-county-fl", "wakulla-county-fl"] },
] as const;

export type MetroSlug = (typeof METROS)[number]["slug"];
